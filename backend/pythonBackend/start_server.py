#!/usr/bin/env python3
"""
FastAPI Server Startup Script
"""
import uvicorn

if __name__ == "__main__":
    print("🚀 Starting FastAPI Server...")
    print("📍 Server: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    print("🔄 Auto-reload: Enabled")
    print("-" * 50)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
