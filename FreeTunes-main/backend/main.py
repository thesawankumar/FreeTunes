from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.routes import router
from fastapi.staticfiles import StaticFiles

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
