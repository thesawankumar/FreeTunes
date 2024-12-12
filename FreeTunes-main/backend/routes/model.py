import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import APIRouter, HTTPException, Depends, Response, Request, BackgroundTasks
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from bson import ObjectId
from jose import jwt, JWTError
from dotenv import load_dotenv
from pathlib import Path
import os
from models.model import user, playlist
from dbconfig import db
from pymongo.errors import PyMongoError


dotenv_path = Path('./client.env')
load_dotenv(dotenv_path=dotenv_path)

SECRET_KEY = os.getenv('SECRET_COOKIE_KEY')
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
EMAIL_HOST = os.getenv("EMAIL_HOST")  
EMAIL_PORT = int(os.getenv("EMAIL_PORT"))  
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

model_router = APIRouter()

# Pydantic Models
class OtpRequest(BaseModel):
    email: EmailStr

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str


def send_email(email: str, otp: str):
    try:

        message = MIMEMultipart()
        message["From"] = EMAIL_USER
        message["To"] = email
        message["Subject"] = "Your OTP Code"
        body = f"Your OTP code is: {otp}. It is valid for 10 minutes."
        message.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASS)
            server.sendmail(EMAIL_USER, email, message.as_string())
        print(f"OTP email sent to {email}")
    except Exception as e:
        print(f"Failed to send email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send OTP email.")


@model_router.post("/generate/otp")
async def generate_otp(request: OtpRequest, background_tasks: BackgroundTasks):
    try:
        email = request.email
        
        
        otp = str(random.randint(100000, 999999))
        time = datetime.utcnow() + timedelta(minutes=10)  
        expiry_time = time.replace(microsecond=0)

        try:
            result = await db["otps"].update_one(
                {"email": email}, 
                {"$set": {"otp": otp, "expiry": expiry_time}}, 
                upsert=True
            )
        except PyMongoError as e:
            print(f"MongoDB error while updating OTP for {email}: {str(e)}")
            raise HTTPException(status_code=500, detail="Database error while saving OTP.")        
        

        updated_document = await db["otps"].find_one({"email": email})

        if updated_document["otp"] != otp or updated_document["expiry"] != expiry_time:
            print(f"Failed to update or insert OTP entry for {email}.")
            raise HTTPException(status_code=500, detail="Error saving OTP.")

        send_email(email, otp)
        return {"message": "OTP generated and sent to the provided email address."}

    except Exception as e:
        print(f"Error while generating OTP: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while generating the OTP.")

@model_router.post("/verify/otp")
async def verify_otp(request: VerifyOtpRequest, response: Response):
    try:
        email = request.email
        otp = request.otp
        
        otp_entry = await db["otps"].find_one({"email": email})
        if not otp_entry:
            raise HTTPException(status_code=404, detail="OTP not found for the provided email.")
        
        if otp_entry["otp"] != otp:
            raise HTTPException(status_code=400, detail="Invalid OTP.")
        
        if otp_entry["expiry"] < datetime.utcnow():
            raise HTTPException(status_code=400, detail="OTP has expired.")
        
        user = await db["users"].find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")

        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        token_data = {"user_id": str(user["_id"]), "email": email}
        token = create_access_token(data=token_data, expires_delta=access_token_expires)

        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=True,
            samesite="Lax",
        )
        
        await db["otps"].delete_one({"email": email})

        return {
            "message": "OTP verified successfully.",
            "access_token": token,
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"],
                "playlist": user.get("playlist", []),
                "history": user.get("history", []),
            }
        }
    

    except Exception as e:
        print(f"Error while verifying OTP: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while verifying the OTP.")

@model_router.post("/create/user", response_model=user)
async def create_user(item: user, response: Response):
    try:
        print('Attempting to create a new item...')

    
        existing_user = await db["users"].find_one({"email": item.email})
        if existing_user:
            print(f"User with email {item.email} already exists.")
            raise HTTPException(status_code=400, detail="A user with this email already exists.")
        
        
        item_dict = item.dict(by_alias=True)
        result = await db["users"].insert_one(item_dict)
        print(f"Item inserted with ID: {result.inserted_id}")
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        token_data = {"user_id": str(result.inserted_id), "email": item.email}
        token = create_access_token(data=token_data, expires_delta=access_token_expires)
        
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=True,
            samesite="Lax",
        )
        
        created_item = await db["users"].find_one({"_id": result.inserted_id})
        if not created_item:
            raise HTTPException(status_code=404, detail="Failed to retrieve the created item from the database")
        
        return created_item

    except Exception as e:
        print(f"Error while creating user: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while creating the user.")

@model_router.get("/verify/token")
async def verify_token(request: Request):
    try:
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(status_code=401, detail="Unauthorized: Token not found.")
        
        payload = verify_access_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Unauthorized: Invalid or expired token.")
        
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized: User ID missing in token.")
        
        user_data = await db["users"].find_one({"_id": ObjectId(user_id)})
        if not user_data:
            raise HTTPException(status_code=401, detail="Unauthorized: User not found.")
        
        return {"message": "Token is valid", "user": user_data}

    except HTTPException as e:
        raise e

    except Exception as e:
        print(f"Error while verifying token: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while verifying the token.")

@model_router.post("/create/playlist", response_model=playlist)
async def create_playlist(item: playlist, request: Request):
    try:
        print('Verifying user for creating a playlist...')
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(status_code=401, detail="Unauthorized: Token not found.")
        
        payload = verify_access_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Unauthorized: Invalid or expired token.")
        
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized: User ID missing in token.")
        
        print('Attempting to create a new playlist...')
        playlist_dict = item.dict(by_alias=True)
        playlist_dict["user_id"] = user_id  # Associate the playlist with the user
        
        result = await db["playlists"].insert_one(playlist_dict)
        print(f"Playlist inserted with ID: {result.inserted_id}")
        
        created_playlist = await db["playlists"].find_one({"_id": result.inserted_id})
        if not created_playlist:
            raise HTTPException(status_code=404, detail="Failed to retrieve the created playlist from the database.")
        
        return created_playlist

    except HTTPException as e:
        raise e

    except Exception as e:
        print(f"Error while creating playlist: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while creating the playlist.")
    
@model_router.put("/update/user/{user_id}", response_model=user)
async def update_user(user_id: str, updated_data: user, request: Request):
    try:
        print('Verifying user for updating user data...')
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(status_code=401, detail="Unauthorized: Token not found.")
        
        payload = verify_access_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Unauthorized: Invalid or expired token.")
        
        token_user_id = payload.get("user_id")
        if not token_user_id or token_user_id != user_id:
            raise HTTPException(status_code=403, detail="Forbidden: You can only update your own data.")
        
        print(f"Attempting to update user with ID: {user_id}")
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format.")
        
        updated_data_dict = updated_data.dict(exclude_unset=True, by_alias=True)
        
        result = await db["users"].update_one(
            {"_id": ObjectId(user_id)}, {"$set": updated_data_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found.")
        
        updated_user = await db["users"].find_one({"_id": ObjectId(user_id)})
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found after update.")
        
        return updated_user

    except HTTPException as e:
        raise e

    except Exception as e:
        print(f"Error while updating user: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while updating the user.")
    
@model_router.put("/update/playlist/{playlist_id}", response_model=playlist)
async def update_playlist(playlist_id: str, updated_data: playlist, request: Request):
    try:
        print('Verifying user for updating playlist...')
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(status_code=401, detail="Unauthorized: Token not found.")
        
        payload = verify_access_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Unauthorized: Invalid or expired token.")
        
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized: User ID missing in token.")
        
        print(f"Attempting to update playlist with ID: {playlist_id}")
        if not ObjectId.is_valid(playlist_id):
            raise HTTPException(status_code=400, detail="Invalid playlist ID format.")
        
        playlist = await db["playlists"].find_one({"_id": ObjectId(playlist_id)})
        if not playlist:
            raise HTTPException(status_code=404, detail="Playlist not found.")
        
        if playlist.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Forbidden: You can only update your own playlists.")
        
        updated_data_dict = updated_data.dict(exclude_unset=True, by_alias=True)
        
        result = await db["playlists"].update_one(
            {"_id": ObjectId(playlist_id)}, {"$set": updated_data_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Playlist not found.")
        
        updated_playlist = await db["playlists"].find_one({"_id": ObjectId(playlist_id)})
        if not updated_playlist:
            raise HTTPException(status_code=404, detail="Playlist not found after update.")
        
        return updated_playlist

    except HTTPException as e:
        raise e

    except Exception as e:
        print(f"Error while updating playlist: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while updating the playlist.")
