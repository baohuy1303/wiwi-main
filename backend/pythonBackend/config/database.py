from pymongo import MongoClient
import os
#from dotenv import load_dotenv
#load_dotenv()

client = MongoClient("mongodb+srv://baohuy1303:hackmidwest@cluster0.okv8b6m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")

db = client["hackmidwest"]
collection = db["users"]