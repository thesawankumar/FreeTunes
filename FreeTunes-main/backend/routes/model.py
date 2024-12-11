from fastapi import APIRouter, HTTPException, Depends
from typing import List
from bson import ObjectId
from models.model import user, playlist
from dbconfig import db 

model_router = APIRouter()

@model_router.post("/create/user", response_model=user)
async def create_user(item: user):
    try:
        print('Attempting to create a new item...')

        existing_user = await db["users"].find_one({"email": item.email})
        if existing_user:
            print(f"User with email {item.email} already exists.")
            raise HTTPException(status_code=400, detail="A user with this email already exists.")
        

        item_dict = item.dict(by_alias=True)

        result = await db["users"].insert_one(item_dict)
        print(f"Item inserted with ID: {result.inserted_id}")
        
        created_item = await db["users"].find_one({"_id": result.inserted_id})
        
        if not created_item:
            raise HTTPException(status_code=404, detail="Failed to retrieve the created item from the database")
        
        return created_item
    
    except Exception as e:
        print(f"Error while creating item: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while creating the item.")


@model_router.post("/create/playlist", response_model=playlist)
async def create_playlist(item: playlist):
    try:
        print('Attempting to create a new playlist...')

        playlist_dict = item.dict(by_alias=True)

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
async def update_user(user_id:str, updated_data: user):
    try:
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
async def update_playlist(playlist_id: str, updated_data: playlist):
    try:
        print(f"Attempting to update playlist with ID: {playlist_id}")
        
        if not ObjectId.is_valid(playlist_id):
            raise HTTPException(status_code=400, detail="Invalid playlist ID format.")
        
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


