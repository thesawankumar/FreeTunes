import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from dotenv import load_dotenv
import os 
from pathlib import Path

dotenv_path = Path('./client.env')
load_dotenv(dotenv_path=dotenv_path)

SPOTIFY_CLIENT_ID = str(os.getenv('Client_ID'))
SPOTIFY_CLIENT_SECRET = str(os.getenv('Client_Secret'))
sp = spotipy.Spotify(client_credentials_manager=SpotifyClientCredentials(client_id=SPOTIFY_CLIENT_ID, client_secret=SPOTIFY_CLIENT_SECRET))


def get_recommendations():
    seed_artists = ['0du5cEVh5yTK9QJze8zA0C','4gzpq5DPGxSnKTe4SA8HAU']
    seed_tracks = ['1mea3bSkSGXuIRvnydlB5b','2plbrEY59IikOBgBGLjaoe']

    recommendations = sp.recommendations(
        seed_artists=seed_artists,  
        seed_tracks=seed_tracks                     
    )
    recommended_tracks = []
    for track in recommendations['tracks']:
        recommended_tracks.append({
            "name": track['name'],
            "artist": track['artists'][0]['name'],  
            "spotify_id": track['id'],  
        })
        
    print(recommended_tracks)


get_recommendations()