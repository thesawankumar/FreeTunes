from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os

MONGO_URI = str(os.getenv('MONGO_URI'))
DB_NAME = str(os.getenv('DB_NAME'))

class MongoDB:
    def __init__(self, uri: str, db_name:str):
        try:
            self.client = AsyncIOMotorClient(uri)
            self.database = self.client[db_name]
            print(f"MongoDB connected to database: {db_name}")
        except Exception as e:
            print(f"Error connecting to MongoDB: {e}")
            
    def get_database(self):
        return self.database
    
mongodb = MongoDB(MONGO_URI, DB_NAME)
db = mongodb.get_database()