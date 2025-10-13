from fastapi import FastAPI, HTTPException
from db_connection import get_async_client, get_async_db

app = FastAPI()

# Use shared database connection
client = get_async_client()
db = get_async_db()

@app.on_event("startup")
async def startup_db_client():
    print("✅ Connected to MongoDB")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    print("❌ Disconnected from MongoDB")

@app.get("/")
async def read_root():
    return {"message": "MongoDB connection successful!"}

@app.get("/users")
async def get_users():
    users = await db["users"].find().to_list(100)
    return users

@app.post("/users")
async def add_user(user: dict):
    result = await db["users"].insert_one(user)
    return {"inserted_id": str(result.inserted_id)}
