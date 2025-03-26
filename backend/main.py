from auth.auth import router as auth_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from dotenv import load_dotenv
load_dotenv()


app = FastAPI()

# Configure CORS with a more permissive origin setup for development
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


@app.get("/api/hello")
async def hello():
    return {"message": "Hello from FastAPI!"}

# Health check endpoint


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
