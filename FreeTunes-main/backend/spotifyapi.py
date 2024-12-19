import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from dotenv import load_dotenv
import os 
from pathlib import Path
from typing import List
from bson import ObjectId
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException
from models.model import user, playlist, PlaylistItem
from dbconfig import db
from fastapi.responses import JSONResponse

dotenv_path = Path('./client.env')
load_dotenv(dotenv_path=dotenv_path)

SPOTIFY_CLIENT_ID = str(os.getenv('Client_ID'))
SPOTIFY_CLIENT_SECRET = str(os.getenv('Client_Secret'))
sp = spotipy.Spotify(client_credentials_manager=SpotifyClientCredentials(client_id=SPOTIFY_CLIENT_ID, client_secret=SPOTIFY_CLIENT_SECRET))

async def get_playlists(playlist_ids: List[ObjectId]) -> List[playlist]:
    playlists_data = await db['playlist'].find({"_id": {"$in": playlist_ids}}).to_list(length=None)
    playlists = [playlist(**playlistx) for playlistx in playlists_data]
    return playlists


def get_spotify_artist_id(artist_name: str) -> str:
    results = sp.search(q=artist_name, type="artist", limit=1)
    if results['artists']['items']:
        return results['artists']['items'][0]['id']
    return None

def get_spotify_track_id(song_name: str, artist_name: str) -> str:
    query = f"track:{song_name} artist:{artist_name}"
    results = sp.search(q=query, type="track", limit=1)
    if results['tracks']['items']:
        return results['tracks']['items'][0]['id']
    return None


async def extract_seeds(user: user):
    artist_ids = []   
    track_ids = []

    
    for item in user.history:
        if item.artistName:
            artist_id = get_spotify_artist_id(item.artistName)
            if artist_id and artist_id not in artist_ids:
                artist_ids.append(artist_id)
        if item.songName and item.artistName:
            track_id = get_spotify_track_id(item.songName, item.artistName)
            if track_id and track_id not in track_ids:
                track_ids.append(track_id)

    if user.playlist:
        playlists = await get_playlists(user.playlist)
        for playlist in playlists:
            for song in playlist.songs:
                if song.artistName:
                    artist_id = get_spotify_artist_id(song.artistName)
                    if artist_id and artist_id not in artist_ids:
                        artist_ids.append(artist_id)
                if song.songName and song.artistName:
                    track_id = get_spotify_track_id(song.songName, song.artistName)
                    if track_id and track_id not in track_ids:
                        track_ids.append(track_id)

    return artist_ids, track_ids

async def get_recommendations(user):
    artists, tracks = await extract_seeds(user)

    latest_artists = artists[-2:] if len(artists) >= 2 else artists

    print(latest_artists)
    latest_tracks = tracks[-3:] if len(tracks) >= 3 else tracks
    print(latest_tracks)
    recommendations = sp.recommendations(
        seed_artists=latest_artists,  
        seed_tracks=latest_tracks                     
    )

    recommended_tracks = []
    for track in recommendations['tracks']:
        recommended_tracks.append({
            "name": track['name'],
            "artist": track['artists'][0]['name'],  
            "spotify_id": track['id'],  
        })
    
    return recommended_tracks

recommendations = APIRouter()

@recommendations.get("/g/{user_id}")
async def recommendations_get(user_id: str):
    try:
        
        user_data = await db['users'].find_one({"_id": ObjectId(user_id)})
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        
        user_instance = user(**user_data)

        
        recommendations = await get_recommendations(user_instance)

        
        return JSONResponse(content={"recommendations": recommendations})
    
    except HTTPException as e:
        raise e
    except Exception as e:
        print(str(e))
        raise HTTPException(status_code=500, detail=str(e))
