import httpx
import joblib
import nilearn
from io import BytesIO
import gzip
import uuid
import os
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from auth.auth import router as auth_router
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from src.plotlyViz.controller import get_slices
from supabase import create_client, Client
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
import tempfile
from typing import Optional
from model import predict_from_nifti

load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise ValueError("Missing Supabase credentials")

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
                   "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include the auth router
app.include_router(auth_router, prefix="/api", tags=["authentication"])

app.mount("/api/nifti_files", StaticFiles(directory="nifti_files"), name="nifti_files")

# Auth dependency
security = HTTPBearer()

# Get supabase client with user token for authenticated requests


def get_supabase_client(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Client:
    supabase.auth.set_auth(credentials.credentials)
    return supabase

# For non-authenticated endpoints


def get_public_client():
    return supabase


# File upload constants
ALLOWED_EXTENSIONS = {"nii", "nii.gz", "DCM"}
ALLOWED_MIME_TYPES = {
    "application/gzip",
    "application/octet-stream",
    "application/dicom",
    "image/dicom",
    "application/x-gzip"
}


@app.get("/api/hello")
async def hello():
    return {"message": "Hello from FastAPI!"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/upload")
async def upload_fmri(
    user_id: str = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    gender: str = Form(...),
    age: int = Form(...),
    diagnosis: str = Form(...),
    atlas: str = Form(None),
    file: UploadFile = File(...),
):
    print(f"[UPLOAD] Starting upload process for file: {file.filename}")
    print(f"[UPLOAD] File size: {file.size if hasattr(file, 'size') else 'unknown'} bytes")
    print(f"[UPLOAD] Content type: {file.content_type}")

    client = supabase
    if "." in file.filename:
        file_extension = file.filename.split('.', 1)[1]
    else:
        file_extension = ""

    mime_type = file.content_type
    print(f"[UPLOAD] File extension: {file_extension}, MIME type: {mime_type}")
    if str(file_extension) not in ALLOWED_EXTENSIONS or mime_type not in ALLOWED_MIME_TYPES:
        print(f"[UPLOAD] Invalid file type: {mime_type}, extension: {file_extension}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    try:
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        print(f"[UPLOAD] Generated unique filename: {unique_filename}")

        # Create a temporary file to stream the upload
        print(f"[UPLOAD] Creating temporary file for streaming")
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            # Stream the file content in chunks to avoid memory issues
            chunk_size = 1024 * 1024  # 1MB chunks
            total_bytes = 0
            print(f"[UPLOAD] Starting to read file in {chunk_size/1024/1024}MB chunks")
            while content := await file.read(chunk_size):
                temp_file.write(content)
                total_bytes += len(content)
                print(f"[UPLOAD] Read {total_bytes/1024/1024:.2f}MB so far")
            
            temp_file.flush()
            temp_file_path = temp_file.name
            print(f"[UPLOAD] Completed reading file, total size: {total_bytes/1024/1024:.2f}MB")
            print(f"[UPLOAD] Temporary file created at: {temp_file_path}")
        
        # Upload using the temporary file
        print(f"[UPLOAD] Starting upload to Supabase storage")
        with open(temp_file_path, "rb") as file_stream:
            print(f"[UPLOAD] File opened for reading, uploading to bucket: fmri-uploads")
            storage_response = client.storage.from_("fmri-uploads").upload(
                path=unique_filename,
                file=file_stream,
                file_options={"content-type": file.content_type}
            )
            print(f"[UPLOAD] Supabase storage response: {storage_response}")
        
        # Run model prediction on the file
        print(f"[UPLOAD] Running model prediction on the file")
        try:
            # Read file content for prediction
            with open(temp_file_path, "rb") as file_content:
                file_bytes = file_content.read()
                
            # Run prediction
            model_result = predict_from_nifti(file_bytes, file.filename)
            print(f"[UPLOAD] Model prediction result: {model_result}")
        except Exception as pred_error:
            print(f"[UPLOAD] Error during model prediction: {str(pred_error)}")
            model_result = 2  # Default value if prediction fails
            print(f"[UPLOAD] Using default model result: {model_result}")
        
        # Clean up the temporary file
        if os.path.exists(temp_file_path):
            print(f"[UPLOAD] Cleaning up temporary file: {temp_file_path}")
            os.unlink(temp_file_path)
            print(f"[UPLOAD] Temporary file deleted")

        fmri_data = {
            "user_id": user_id,
            "title": title,
            "description": description,
            "gender": gender,
            "age": age,
            "diagnosis": diagnosis,
            "atlas": atlas,
            "model_result": model_result,
            "file_link": unique_filename
        }

        print(f"[UPLOAD] Inserting data into fmri_history table: {fmri_data}")
        result = client.table("fmri_history").insert(fmri_data).execute()
        print(f"[UPLOAD] Database insert result: {result}")

        if result.data and len(result.data) > 0:
            fmri_id = result.data[0]['fmri_id']
            print(f"[UPLOAD] Upload successful, fmri_id: {fmri_id}")
            return {
                "message": "File uploaded successfully",
                "fmri_id": fmri_id,
                "file_path": unique_filename,
                "model_result": model_result
            }
        else:
            print("[UPLOAD] Failed to retrieve inserted record ID")
            raise HTTPException(
                status_code=500, detail="Failed to retrieve inserted record ID")

    except Exception as e:
        # Clean up the temporary file if it exists
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            try:
                print(f"[UPLOAD] Error occurred, cleaning up temporary file: {temp_file_path}")
                os.unlink(temp_file_path)
            except Exception as cleanup_error:
                print(f"[UPLOAD] Failed to delete temporary file: {cleanup_error}")
        print(f"[UPLOAD] Error during upload: {str(e)}")
        print(f"[UPLOAD] Error type: {type(e).__name__}")
        import traceback
        print(f"[UPLOAD] Error traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/2d-fmri-data/{fmri_id}/{slice_index}")
async def get_2d_fmri_data(
    fmri_id: int,
    slice_index: int,
    supabase: Client = Depends(get_public_client),
):
    # Fetch FMRI data record from database
    response = supabase.table("fmri_history").select(
        "*").eq("fmri_id", fmri_id).execute()

    if not response.data or len(response.data) == 0:
        raise HTTPException(status_code=404, detail="FMRI data not found")

    fmri_data = response.data[0]
    file_name = fmri_data["file_link"]
    print(f"File name: {file_name}")

    try:
        # Download file from Supabase storage
        file_bytes = supabase.storage.from_("fmri-uploads").download(file_name)

        # Create temporary file with appropriate extension
        temp_file_name = None
        try:
            # Create a temporary file with the correct extension
            suffix = '.nii.gz' if file_name.lower().endswith('.gz') else '.nii'
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp_file:
                temp_file_name = temp_file.name

                # Write the file contents
                temp_file.write(file_bytes)
                temp_file.flush()

            print(f"Processing file: {temp_file_name}")

            # Process the file
            slices = get_slices(temp_file_name, slice_index)
            print("Slices processed successfully")
            return slices

        finally:
            # Clean up the temporary file
            if temp_file_name and os.path.exists(temp_file_name):
                try:
                    os.unlink(temp_file_name)
                except Exception as e:
                    print(
                        f"Warning: Could not delete temporary file {temp_file_name}: {str(e)}")

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing fMRI data: {str(e)}")

@app.get("/api/3d-fmri-file/{fmri_id}/")
async def get_3d_fmri_file(
    fmri_id: int,
    supabase: Client = Depends(get_public_client)
):
    # Fetch FMRI data record from database
    response = supabase.table("fmri_history").select(
        "*").eq("fmri_id", fmri_id).execute()

    if not response.data or len(response.data) == 0:
        raise HTTPException(status_code=404, detail="FMRI data not found")

    file_name = response.data[0]["file_link"]
    print(f"File name: {file_name}")
    
    try:
        file_bytes = supabase.storage.from_("fmri-uploads").download(file_name)
        
        suffix = '.nii.gz' if file_name.lower().endswith('.gz') else '.nii'
        unique_name = f"{uuid.uuid4()}{suffix}"
        save_path = os.path.join("nifti_files", unique_name)

        with open(save_path, "wb") as f:
            f.write(file_bytes)

        # Return URL for frontend viewer (like Niivue)
        return {
            "url": f"/nifti_files/{unique_name}",
            "filename": unique_name  # for cleanup if needed
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing fMRI data: {str(e)}")

@app.delete("/api/delete-temp-files/")
def delete_temp_files():
    directory = "nifti_files"
    deleted_files = []

    if not os.path.exists(directory):
        raise HTTPException(404, "Directory not found")

    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        try:
            if os.path.isfile(file_path):
                os.remove(file_path)
                deleted_files.append(filename)
        except Exception as e:
            print(f"Failed to delete {file_path}: {e}")

    return {"detail": f"Deleted {len(deleted_files)} files", "files": deleted_files}
    

@app.get("/api/user-fmri-history/{user_id}")
async def get_user_fmri_history(
    user_id: str,
    supabase: Client = Depends(get_public_client),
):
    response = supabase.table("fmri_history").select(
        "*").eq("user_id", user_id).execute()

    if not response.data:
        return {"history": []}

    return {"history": response.data}

@app.get("/api/model-prediction/{fmri_id}")
def get_model_result(
    fmri_id: int, 
    supabase: Client = Depends(get_public_client),
):
    response = supabase.table("fmri_history").select(
        "model_result").eq("fmri_id", fmri_id).single().execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Model result not found")

    return {"model_result": response.data["model_result"]}

# Run the application if the script is executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
