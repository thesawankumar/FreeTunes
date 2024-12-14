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
from models.model import user, playlist, PlaylistItem
from dbconfig import db
from pymongo.errors import PyMongoError
from fastapi.security import OAuth2PasswordBearer
from typing import Optional, List


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

dotenv_path = Path('./client.env')
load_dotenv(dotenv_path=dotenv_path)

SECRET_KEY = os.getenv('SECRET_COOKIE_KEY')
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
EMAIL_HOST = os.getenv("EMAIL_HOST")  
EMAIL_PORT = int(os.getenv("EMAIL_PORT"))  
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

class PlaylistUpdateRequest(BaseModel):
    action: str  
    song: PlaylistItem  
    name: str
    userID: str
    liked: Optional[bool]

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class PlaylistUpdateResponse(BaseModel):
    name: str
    userID: str
    songs: List[PlaylistItem]  
    liked: Optional[bool]

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

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

class TokenRequest(BaseModel):
    access_token: str

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
            raise HTTPException(status_code=500, detail={"generated":False})        
        

        updated_document = await db["otps"].find_one({"email": email})

        if updated_document["otp"] != otp or updated_document["expiry"] != expiry_time:
            print(f"Failed to update or insert OTP entry for {email}.")
            raise HTTPException(status_code=500, detail={"generated":False})

        send_email(email, otp)
        return {"generated": True}

    except Exception as e:
        print(f"Error while generating OTP: {e}")
        raise HTTPException(status_code=500, detail={"generated":False})

@model_router.post("/verify/otp")
async def verify_otp(request: VerifyOtpRequest, response: Response):
    try:
        email = request.email
        otp = request.otp
        
        otp_entry = await db["otps"].find_one({"email": email})
        if not otp_entry:
            raise HTTPException(status_code=404, detail={"verified":False, "message":"OTP not found for the provided email."})
        
        if otp_entry["otp"] != otp:
            raise HTTPException(status_code=400, detail={"verified":False, "message":"Invalid OTP."})
        
        if otp_entry["expiry"] < datetime.utcnow():
            raise HTTPException(status_code=400, detail={"verified":False, "message": "OTP has expired."})
        
        user = await db["users"].find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail={"verified":False, "message":"User not found"})

        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        token_data = {"user_id": str(user["_id"]), "email": email}
        token = create_access_token(data=token_data, expires_delta=access_token_expires)

        await db["otps"].delete_one({"email": email})

        return {
            "verified" : True,
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
        raise HTTPException(status_code=500, detail={"verified":False, "message":"Internal Server Error"})

#verify otp for new user
@model_router.post("/verify/otp-new")
async def verify_otp_new(request: VerifyOtpRequest, response: Response):
    try:
        email = request.email
        otp = request.otp
        print(email)
        print(otp)
        otp_entry = await db["otps"].find_one({"email": email})

        if not otp_entry:
            print('check 1')
            raise HTTPException(status_code=404, detail={"verified":False, "message":"OTP not found for the provided email."})
        
        if otp_entry["otp"] != otp:
            print('check 2')
            raise HTTPException(status_code=400, detail={"verified":False, "message":"Invalid OTP."})
        
        if otp_entry["expiry"] < datetime.utcnow():
            print('check 3')
            raise HTTPException(status_code=400, detail={"verified":False, "message": "OTP has expired."})
        
        await db["otps"].delete_one({"email": email})

        return {
            "verified" : True,
            "message": "OTP verified successfully."
        }
    

    except Exception as e:
        print(f"Error while verifying OTP: {e}")
        raise HTTPException(status_code=500, detail={"verified":False, "message":"Internal Server Error"})


@model_router.post("/create/user")
async def create_user(item: user, request: Request):
    try:
        print('Attempting to create a new item...')

    
        existing_user = await db["users"].find_one({"email": item.email})
        if existing_user:
            print(f"User with email {item.email} already exists.")
            raise HTTPException(status_code=400, detail={"status": False, "message": "A user with this email already exists."})
        
        
        item_dict = item.dict(by_alias=True)
        result = await db["users"].insert_one(item_dict)
        print(f"Item inserted with ID: {result.inserted_id}")
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        token_data = {"user_id": str(result.inserted_id), "email": item.email}
        token = create_access_token(data=token_data, expires_delta=access_token_expires)
        
        default_playlist = playlist(
            name="Liked",
            userID=str(result.inserted_id),
            songs=PlaylistItem(songName="Sample Song", artistName="Sample Artist"),
            liked=True
        )

        playlist_dict = default_playlist.dict(by_alias=True)
        playlist_result = await db["playlist"].insert_one(playlist_dict)
        print(f"Liked playllist inserted with ID : {playlist_result.inserted_id}")

        await db["users"].update_one(
            {"_id": result.inserted_id},
            {"$set": {"playlist": [str(playlist_result.inserted_id)]}}
        )

        created_item = await db["users"].find_one({"_id": result.inserted_id})
        
        if created_item:
            created_item["_id"] = str(created_item["_id"])
        
        if not created_item:
            raise HTTPException(status_code=404, detail={"status": False, "message": "Failed to retrieve the created item from the database"})
        
        return {
            "status": True,
            "user": {
                "id": str(created_item["_id"]),
                "name": item.name,  # Ensure name is returned
                "email": item.email,  # Ensure email is returned
                "playlist": created_item.get("playlist", []),
                "history": created_item.get("history", []),
            },
            "access_token": token
        }

    except Exception as e:
        print(f"Error while creating user: {e}")
        raise HTTPException(status_code=500, detail={"status": False, "message": "An unexpected error occurred while creating the user."})

@model_router.post("/verify/token")
async def verify_token(request: TokenRequest):    
    try:
        token = request.access_token
        if not token:
            raise HTTPException(status_code=401, detail={"auth" : False, "message": "Unauthorized: Token not found."})
        
        payload = verify_access_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail={"auth" : False, "message": "Unauthorized: Invalid or expired token."})
        
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail={"auth" : False, "message": ""})
        
        user_data = await db["users"].find_one({"_id": ObjectId(user_id)})

        if user_data:
            user_data["_id"] = str(user_data["_id"])

        if not user_data:
            raise HTTPException(status_code=401, detail={"auth" : False, "message": "Unauthorized: User not found."})
        
        return {
            "auth" : True,
            "message": "Token is valid", 
                "user": {
                "id": str(user_data["_id"]),
                "name": user_data["name"],  # Ensure name is returned
                "email": user_data["email"],  # Ensure email is returned
                "playlist": user_data.get("playlist", []),
                "history": user_data.get("history", []),
            }}

    except Exception as e:
        print(f"Error while verifying token: {e}")
        raise HTTPException(status_code=500, detail={"auth" : False, "message": "An unexpected error occurred while verifying the token."})

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
        if created_playlist:
            created_playlist["_id"] = str(created_playlist["_id"])
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
        if updated_user:
            updated_user["_id"] = str(updated_user["_id"])

        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found after update.")
        
        return updated_user

    except HTTPException as e:
        raise e

    except Exception as e:
        print(f"Error while updating user: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while updating the user.")

@model_router.put("/update/playlist/{playlist_id}", response_model=PlaylistUpdateResponse)
async def update_playlist(playlist_id: str, updated_data: PlaylistUpdateRequest, request: Request):
    try:
        print('Verifying user for updating playlist...')
        
        # Authorization logic
        authorization_header = request.headers.get("Authorization")
        if not authorization_header:
            raise HTTPException(status_code=401, detail="Unauthorized: Token not found")
        
        payload = verify_access_token(authorization_header)
        if not payload:
            raise HTTPException(status_code=401, detail="Unauthorized: Invalid or expired token.")
        
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized: User ID missing in token.")
        
        # Validate playlist ID
        print(f"Attempting to update playlist with ID: {playlist_id}")
        if not ObjectId.is_valid(playlist_id):
            raise HTTPException(status_code=400, detail="Invalid playlist ID format.")
        
        playlist = await db["playlist"].find_one({"_id": ObjectId(playlist_id)})
        if not playlist:
            raise HTTPException(status_code=404, detail="Playlist not found.")
        
        if playlist.get("userID") != user_id:
            raise HTTPException(status_code=403, detail="Forbidden: You can only update your own playlists.")
        
        # Handle the action and song update
        action = updated_data.action
        song = updated_data.song

        if not song or not song.songName or not song.artistName:
            raise HTTPException(status_code=400, detail="Song information missing or invalid.")

        # Get the existing songs from the playlist
        existing_songs = playlist.get("songs", [])

        # Convert existing songs to dictionaries (in case they're objects)
        existing_songs = [
            song.dict() if isinstance(song, PlaylistItem) else song
            for song in existing_songs
        ]

        # Add or remove the song based on the action
        if action == "add":
            if any(existing_song['songName'] == song.songName and existing_song['artistName'] == song.artistName for existing_song in existing_songs):
                raise HTTPException(status_code=400, detail="Song already exists in the playlist.")
            existing_songs.append(song.dict())
        elif action == "remove":
            existing_songs = [
                existing_song for existing_song in existing_songs
                if not (existing_song['songName'] == song.songName and existing_song['artistName'] == song.artistName)
            ]
        else:
            raise HTTPException(status_code=400, detail="Invalid action. Use 'add' or 'remove'.")

        # Update the playlist
        updated_data_dict = updated_data.dict(exclude_unset=True)
        updated_data_dict['songs'] = existing_songs  # Ensure songs are dictionaries
        updated_data_dict.pop('action', None) 

        result = await db["playlist"].update_one(
            {"_id": ObjectId(playlist_id)}, {"$set": updated_data_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Playlist not found.")
        
        # Fetch and return the updated playlist
        updated_playlist = await db["playlist"].find_one({"_id": ObjectId(playlist_id)})
        if updated_playlist:
            updated_playlist["_id"] = str(updated_playlist["_id"])
        
        if not updated_playlist:
            raise HTTPException(status_code=404, detail="Playlist not found after update.")
        
        return PlaylistUpdateResponse(**updated_playlist)

    except HTTPException as e:
        raise e

    except Exception as e:
        print(f"Error while updating playlist: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while updating the playlist.")
