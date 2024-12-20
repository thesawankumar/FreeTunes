import yt_dlp.YoutubeDL
import yt_dlp
import os 
import subprocess
from pathlib import Path
import json
import asyncio
from fastapi import WebSocket, WebSocketDisconnect
import shutil
from datetime import datetime, timedelta
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from dotenv import load_dotenv

dotenv_path = Path('./client.env')
load_dotenv(dotenv_path=dotenv_path)

SPOTIFY_CLIENT_ID = str(os.getenv('Client_ID'))
SPOTIFY_CLIENT_SECRET = str(os.getenv('Client_Secret'))
sp = spotipy.Spotify(client_credentials_manager=SpotifyClientCredentials(client_id= SPOTIFY_CLIENT_ID,client_secret= SPOTIFY_CLIENT_SECRET))

COOKIES_DIR = 'youtube.com_cookies.txt' 

async def songdetails(search_query):

    try:
        result = sp.search(search_query, type='track', limit=1)

        if result['tracks']['items']:
            track = result['tracks']['items'][0]
            artist = track['artists'][0]['name']
            song = track['name']
            print(f"Found track: Artist: {artist}, Song: {song}")
            return artist, song
        else:
            print("No tracks found for this search query.")
            return None, None

    except Exception as e:
        print(f"Error occurred while searching for the song: {e}")
        return None, None

async def deletefolder(folder_path:str):
    await asyncio.sleep(360)

    if os.path.exists(folder_path):
        shutil.rmtree(folder_path)
        print(f"Deleted folder: {folder_path}")
    else:
        print(f"Folder {folder_path} not found, could not delete")

async def get_id(search_query):
        
        ydl_opts = {
            'quiet' : True,
            'extract_flat': True,
            'cookies' : COOKIES_DIR,
            'verbose': True, 
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            result = ydl.extract_info(f"ytsearch1:{search_query}",download = False)
        
            if 'entries' in result:
                video_id = result['entries'][0]['id']
                return video_id
            else:
                print("No results found")
                return None


async def search2hls(search_query: str, websocket: WebSocket):

    async def yt_search(search_query):
        ydl_opts = {
            'quiet' : True,
            'extract_flat': True,
            'cookies' : 'youtube_cookies.txt',
            'verbose': True, 
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            result = ydl.extract_info(f"ytsearch1:{search_query}",download = False)
        
            if 'entries' in result:
                video_id = result['entries'][0]['id']
                return video_id
            else:
                print("No results found")
                return None

    async def download_audio(video_id):
        output_dir = "./mp3"
        os.makedirs(output_dir,exist_ok=True)
        mp3_file = os.path.join(output_dir, f"{video_id}.mp3")
        ydl_opts = {
            'format': 'bestaudio/best',
            'extract_audio': True,
            'audioformat': 'mp3',
            'outtmpl': mp3_file,
            'quiet': True,
            'cookies' : COOKIES_DIR,
            'verbose': True, 
        }

        print(f"Downloading MP3 for video ID: {video_id}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([f"https://www.youtube.com/watch?v={video_id}"])

        if not os.path.exists(mp3_file):
            print("Failed to download MP3.")
            return None
        
        return mp3_file

    async def convert_hls(video_id, mp3_file):
        output_dir = "./hls"
        hls_dir = os.path.join(output_dir, video_id)

        os.makedirs(hls_dir, exist_ok=True)

        hls_file = os.path.join(hls_dir, f"{video_id}.m3u8")

        print(f"Converting MP3 to HLS format: {hls_file}")
        command = [
            "ffmpeg",
            "-i", mp3_file,             # Input MP3 file
            "-acodec", "aac",           # Convert to AAC codec
            "-b:a", "320k",             # Set audio bitrate
            "-hls_time", "10",          # Duration of each segment
            "-hls_list_size", "0",      # Include all segments in the playlist
            "-f", "hls",                # Output format: HLS
            hls_file                    # Output playlist
        ]

        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        subprocess.run(command, check=True)

        print(f"HLS files are saved in: {hls_dir}")

        if os.path.exists(mp3_file):
            os.remove(mp3_file)
            print(f"Deleted the MP3 file: {mp3_file}")

        asyncio.create_task(deletefolder(hls_dir))
    
    id = await yt_search(search_query)
    if not id:
        await websocket.send_text("video id not found, aborting")
        return

    mp3 = await download_audio(id)

    if not mp3:
        await websocket.send_text("MP3 download failed, aborting.")
        print("MP3 download failed, aborting.")
        return
    
    await convert_hls(id, mp3)    
    return id


async def streaming(id:str):
    base_dir = "./hls"

    subfolder_path = Path(base_dir) / id

    if not subfolder_path.is_dir():
        return None
    
    m3u8_file = list(subfolder_path.glob("*.m3u8"))

    file = m3u8_file[0]
    desired_url =str(file)[4:]
    print(desired_url)
    return desired_url


