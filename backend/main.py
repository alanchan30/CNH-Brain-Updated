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
from fastapi import FastAPI
from dotenv import load_dotenv
from src.plotlyViz.controller import get_slices
from supabase import create_client, Client
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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
)

# Include the auth router
app.include_router(auth_router, prefix="/api", tags=["authentication"])

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
    file: UploadFile = File(...),
    supabase: Client = Depends(get_public_client),
):
    try:
        # Check file extension and mime type
        if "." in file.filename:
            file_extension = file.filename.split('.', 1)[1]
        else:
            file_extension = ""

        mime_type = file.content_type
        print(mime_type)
        if str(file_extension) not in ALLOWED_EXTENSIONS or mime_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        try:
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
        except Exception as e:
            raise HTTPException(status_code=300, detail=str(e))

        # Read file contents
        file_contents = await file.read()
        print(type (file_contents))
        try:
            model_result = predict_from_nifti(file_contents, file.filename)

            # Upload file to Supabase storage without additional compression
            storage_response = supabase.storage.from_("fmri-uploads").upload(
                path=unique_filename,
                file=file_contents,
                file_options={"content-type": file.content_type}
            )

            # Insert record into database
            fmri_data = {
                "user_id": user_id,
                "title": title,
                "description": description,
                "gender": gender,
                "age": age,
                "diagnosis": diagnosis,
                "model_result": model_result,
                "file_link": unique_filename
            }

            # Insert into the fmri_history table
            result = supabase.table("fmri_history").insert(fmri_data).execute()
            
            # Get the inserted record's ID
            if result.data and len(result.data) > 0:
                fmri_id = result.data[0]['fmri_id']
                return {
                    "message": "File uploaded successfully",
                    "fmri_id": fmri_id,
                    "file_path": unique_filename,
                }
            else:
                raise HTTPException(
                    status_code=500, detail="Failed to retrieve inserted record ID")
        except Exception as e:
            print("Error in predict_from_nifti:", e)
            raise


    except Exception as e:
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
