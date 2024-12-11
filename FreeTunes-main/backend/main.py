from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.routes import router
from fastapi.staticfiles import StaticFiles
from dbconfig import MongoDB
from dotenv import load_dotenv
from pathlib import Path
import os
from routes.model import model_router


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],  
    allow_headers=["*"],  
)

app.mount("/static", StaticFiles(directory="hls"))
app.include_router(router)
app.include_router(model_router, prefix="/model", tags=["Users"])
