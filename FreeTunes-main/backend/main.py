from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.routes import router
from fastapi.staticfiles import StaticFiles
from dbconfig import MongoDB
from dotenv import load_dotenv
from pathlib import Path
import os
from routes.model import model_router
from fastapi import APIRouter, HTTPException, Depends, Response, Request, BackgroundTasks
from spotifyapi import recommendations

hls_directory = "hls"

os.makedirs(hls_directory, exist_ok=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],  
    allow_headers=["*"],  
)

@app.get("/test")
async def get_message(request: Request):
    user_agent = request.headers.get("User-Agent")
    referer = request.headers.get("Referer")
    print(f"Request from {user_agent}, Referer: {referer}")
    return {"message": "This is a test message."}


app.mount("/static", StaticFiles(directory="hls"))
app.include_router(router)
app.include_router(recommendations, prefix="/recommed", tags=["Recommendations"])
app.include_router(model_router, prefix="/model", tags=["Users"])
from fastapi import Request
