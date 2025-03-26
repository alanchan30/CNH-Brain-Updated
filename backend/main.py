from fastapi import FastAPI, File, UploadFile, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os
import uuid
import httpx 
from database import SessionLocal, FMRI_History, get_db, User

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise ValueError("Missing Supabase credentials")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/hello")
async def hello():
    return {"message": "Hello from FastAPI!"}

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
        # Verify user exists
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Generate a unique filename
        file_extension = file.filename.split('.')[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        
        # Read file contents
        file_contents = await file.read()
        
        # Upload file to Supabase storage using httpx
        async with httpx.AsyncClient() as client:
            upload_response = await client.post(
                f"{SUPABASE_URL}/storage/v1/object/fmri-uploads/{unique_filename}",
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                    "Content-Type": file.content_type
                },
                content=file_contents
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

# Run the application if the script is executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)