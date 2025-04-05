import httpx
from database import SessionLocal, FMRI_History, get_db, User
from io import BytesIO
import gzip
import uuid
import os
from sqlalchemy.orm import Session
from fastapi import FastAPI, File, UploadFile, Form, Depends, HTTPException
from auth.auth import router as auth_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from dotenv import load_dotenv
from src.plotlyViz.controller import get_slices
load_dotenv()

# Configure CORS with a more permissive origin setup for development

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise ValueError("Missing Supabase credentials")

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

# Add other routes and API logic as needed

ALLOWED_EXTENSIONS = {"nii", "nii.gz", "DCM"}
ALLOWED_MIME_TYPES = {
    "application/gzip",
    "application/octet-stream",
    "application/dicom",
    "image/dicom"
}


@app.get("/api/hello")
async def hello():
    return {"message": "Hello from FastAPI!"}

# Health check endpoint


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/api/upload")
async def upload_fmri(
    user_id: int = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    gender: str = Form(...),
    age: int = Form(...),
    diagnosis: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    try:
        # # Verify user exists
        # user = db.query(User).filter(User.user_id == user_id).first()
        # if not user:       
        #     raise HTTPException(status_code=404, detail="User not found")

        file_extension = file.filename.split('.', 1)[1]
        mime_type = file.content_type

        if file_extension not in ALLOWED_EXTENSIONS or mime_type not in ALLOWED_MIME_TYPES:
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

        print(f"original: {len(file_contents)/1024:.2f}")

        compressed_buffer = BytesIO()
        with gzip.GzipFile(fileobj=compressed_buffer, mode="wb") as gz:
            gz.write(file_contents)
        compressed_data = compressed_buffer.getvalue()
        print(f"adsf: {len(compressed_data)/1024:.2f}")
        # Upload file to Supabase storage using httpx
        async with httpx.AsyncClient() as client:
            upload_response = await client.post(
                f"{SUPABASE_URL}/storage/v1/object/fmri-uploads/{unique_filename}",
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                    "Content-Type": file.content_type
                },
                content=compressed_data
            )

            # Check if upload was successful
            if upload_response.status_code not in [200, 201]:
                raise HTTPException(
                    status_code=500,
                    detail=f"Supabase upload failed: {upload_response.text}"
                )

        # Create a database record for the fMRI upload
        fmri_history = FMRI_History(
            user_id=user_id,
            title=title,
            description=description,
            gender=gender,
            age=age,
            diagnosis=diagnosis,
            file_link=unique_filename
        )

        db.add(fmri_history)
        db.commit()
        db.refresh(fmri_history)

        return {
            "message": "File uploaded successfully",
            "fmri_id": fmri_history.fmri_id,
            "file_path": unique_filename
        }

    except Exception as e:
        # Rollback the database transaction in case of an error
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/2d-fmri-data")
async def get_2d_fmri_data(
    db: Session = Depends(get_db),
):
    fmri_data = db.query(FMRI_History).all()
    return fmri_data

# Run the application if the script is executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
