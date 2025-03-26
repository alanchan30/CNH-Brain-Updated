from backend.database import SessionLocal
from fastapi import FastAPI, File, UploadFile, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os
import uuid
from supabase import create_client, Client
from backend.models import FMRIUpload
from backend.schemas import FMRIUploadCreate

# Load environment variables from .env file
load_dotenv()

# Retrieve Supabase credentials from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# Validate that credentials are present
if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise ValueError("Missing credentials from .env")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Create FastAPI application instance
app = FastAPI()

# Database session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Allow CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple health check endpoint
@app.get("/api/hello")
async def hello():
    return {"message": "Hello from FastAPI!"}

# Endpoint for uploading fMRI files
@app.post("/api/upload/")
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
        # Generate a unique filename for the uploaded file
        file_extension = file.filename.split('.')[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        
        # Upload file to Supabase storage
        file_contents = await file.read()
        supabase_response = supabase.storage.from_("fmri-uploads").upload(
            file=file_contents,
            path=unique_filename,
            file_options={"content-type": file.content_type}
        )
        
        # Create database record for the upload
        fmri_upload = FMRIUpload(
            user_id=user_id,
            title=title,
            description=description,
            gender=gender,
            age=age,
            diagnosis=diagnosis,
            file_path=unique_filename
        )
        
        # Add and commit the record to the database
        db.add(fmri_upload)
        db.commit()
        db.refresh(fmri_upload)
        
        return {
            "message": "File uploaded successfully",
            "file_id": fmri_upload.id,
            "file_path": unique_filename
        }
    
    except Exception as e:
        # Rollback the database transaction in case of an error
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Run the application if the script is executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)