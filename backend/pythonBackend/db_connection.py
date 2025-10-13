"""
Shared database connection module
Provides both async and sync MongoDB connections for the application
"""
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection URI
MONGO_URI = os.getenv("CONNECTION_URI", "mongodb+srv://baohuy1303:hackmidwest@cluster0.okv8b6m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
DATABASE_NAME = "hackmidwest"

# Synchronous MongoDB client (for tools and direct queries)
sync_client = MongoClient(MONGO_URI, server_api=ServerApi('1'))
sync_db = sync_client[DATABASE_NAME]

# Asynchronous MongoDB client (for FastAPI endpoints)
async_client = AsyncIOMotorClient(MONGO_URI)
async_db = async_client[DATABASE_NAME]

def get_sync_client():
    """Get the synchronous MongoDB client"""
    return sync_client

def get_sync_db():
    """Get the synchronous database instance"""
    return sync_db

def get_async_client():
    """Get the asynchronous MongoDB client"""
    return async_client

def get_async_db():
    """Get the asynchronous database instance"""
    return async_db
