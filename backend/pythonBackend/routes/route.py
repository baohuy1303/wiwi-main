from fastapi import APIRouter
from models.Users import User
from config.database import collection
from schemas.Users import user_default_data, list_user_data
from bson import ObjectId

router = APIRouter()

@router.get("/")
async def get_users():
    users = list_user_data(collection.find())
    return users