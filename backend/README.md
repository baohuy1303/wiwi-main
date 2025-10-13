# FastAPI MongoDB Backend

A FastAPI application with MongoDB integration for your project.

## Features

- ✅ FastAPI with automatic API documentation
- ✅ MongoDB integration with PyMongo
- ✅ Environment variable configuration
- ✅ Health check endpoints
- ✅ CRUD operations for items
- ✅ Error handling and validation

## Setup Instructions

### 1. Install Dependencies

```bash
# Activate virtual environment
venv/Scripts/activate  # Windows
# or
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure MongoDB

Update the MongoDB connection string in `config.py`:

```python
MONGODB_URI = "mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
```

### 3. Run the Application

```bash
# Option 1: Using the startup script
python run.py

# Option 2: Direct uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Option 3: Using main.py
python main.py
```

## API Endpoints

- `GET /` - Welcome message and status
- `GET /health` - Health check with database status
- `GET /items` - Get all items from MongoDB
- `POST /items` - Create a new item
- `GET /items/{item_id}` - Get specific item
- `GET /docs` - Interactive API documentation (Swagger UI)

## Environment Variables

Create a `.env` file in the backend directory:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
DATABASE_NAME=your_database_name
HOST=0.0.0.0
PORT=8000
DEBUG=True
```

## Testing the API

1. Start the server: `python run.py`
2. Visit http://localhost:8000/docs for interactive documentation
3. Test endpoints using the Swagger UI or curl:

```bash
# Health check
curl http://localhost:8000/health

# Create an item
curl -X POST "http://localhost:8000/items" \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Item", "description": "A test item"}'

# Get all items
curl http://localhost:8000/items
```

## Project Structure

```
backend/
├── main.py          # FastAPI application
├── config.py        # Configuration settings
├── run.py           # Startup script
├── requirements.txt # Python dependencies
└── README.md        # This file
```
