from typing import Union, List
import os
import smtplib
from email.message import EmailMessage
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel
from dotenv import load_dotenv
from strands import agent
from db_connection import get_sync_client

from agents.agent import create_agent, create_fresh_agent, initialize_default_agent
from agents.agent_tools.s3_tools import upload_to_s3

class AgentRequest(BaseModel):
    prompt: str

class EmailRequest(BaseModel):
    user_email: str
    username: str
    item_name: str
    message: str = "You just won a gaming laptop in the raffle you recently entered."

class RaffleWinnerRequest(BaseModel):
    winner_id: str
    item_id: str
    winner_email: str
    item_title: str
    seller_email: str
    ticket_cost: int
    tickets_spent: int
    charity_overflow: int = 0

# Load environment variables
load_dotenv()

app = FastAPI()

# Get frontend URL from environment variables
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Add CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],  # Frontend URL from .env
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Use shared database connection
client = get_sync_client()
agent = initialize_default_agent()

# Test MongoDB connection
try:
    client.admin.command('ping')
    print("✅ Pinged your deployment. You successfully connected to MongoDB!")
    db_status = "Connected"
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    db_status = "Failed"

@app.get("/")
def read_root():
    return {
        "message": "FastAPI Backend with MongoDB",
        "mongodb_status": db_status,
        "status": "running"
    }

@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "mongodb": db_status,
        "message": "All systems operational"
    }


# agent API endpoint
@app.post("/agent/chats")
def prompt_agent(request: AgentRequest):
    try:
        response = agent(request.prompt)
        return {"response": response}
    except Exception as e:
        return {"error": str(e)}

@app.post("/agent/analyze_images")
async def analyze_images(
    images: List[UploadFile] = File(...),
    title: str = Form(""),
    description: str = Form(""),
    condition: str = Form(""),
    analyze_together: bool = Form(True)
):
    """
    Analyze single or multiple product images for auction quality rating.
    
    This endpoint creates fresh AI agent instances for each analysis to:
    - Prevent context overflow from accumulated conversation history
    - Avoid cross-contamination between different product analyses
    - Ensure each product is analyzed independently with clean context
    
    Args:
        images: List of image files to analyze (can be just one image)
        description: Optional description for all images
        analyze_together: If True, analyze all images together; if False, analyze each separately
        
    Memory Management:
        - Fresh agent instances are created for each request
        - Agent references are explicitly deleted after use to enable garbage collection
        - This prevents context window overflow and ensures accurate, independent analyses
    """
    try:
        if not images:
            raise HTTPException(status_code=400, detail="At least one image is required")
        
        if len(images) > 10:
            raise HTTPException(status_code=400, detail="Maximum 10 images allowed per request")
        
        # Upload all images to S3
        uploaded_images = []
        for image in images:
            try:
                image_url = upload_to_s3(image.file, image.filename)
                uploaded_images.append({
                    "filename": image.filename,
                    "url": image_url,
                    "content_type": image.content_type
                })
            except Exception as e:
                print(f"Failed to upload {image.filename}: {e}")
                continue
        
        if not uploaded_images:
            raise HTTPException(status_code=500, detail="Failed to upload any images")
        
        # Create analysis prompt based on analyze_together flag
        if analyze_together:
            # Create a fresh agent instance to prevent context overflow
            fresh_agent = create_fresh_agent()
            if not fresh_agent:
                raise HTTPException(status_code=500, detail="Failed to initialize AI agent")
            
            # Analyze all images together as a set
            image_urls = [img["url"] for img in uploaded_images]
            image_filenames = [img["filename"] for img in uploaded_images]
            
            prompt = f"""Be a balanced auction verifier. Analyze these {len(uploaded_images)} product images using `analyze_image` to detect authenticity — start cautiously (the seller *might* use stock/AI images) but remain fair and evidence-driven. 
            Check EXIF, lighting, background, watermarks, and editing artifacts; to confirm uniqueness(This is an important step). Compare with similar items (DB + web) to suggest a reasonable price range, lowering estimates for used or suspicious listings. 
            Rate auction quality (0–100) for authenticity, clarity, and technical quality, and provide a short justification and recommended action (accept/manual_review/reject/request_better_images).

            
            If the images look too polished or reused, recommend manual review or reject.
            
            Image URLs: {', '.join(image_urls)}
            Image filenames: {', '.join(image_filenames)}
            """
            if description:
                prompt += f"Additional context: {description}. "
            prompt += "Use the analyze_image tool to get detailed analysis for each image."
            
            # Use the fresh agent to analyze all images together
            response = fresh_agent(prompt)
            
            # IMPORTANT: Clear the agent reference to allow garbage collection
            # This ensures the agent's context/memory is freed and prevents:
            # 1. Context window overflow from accumulated history
            # 2. Cross-contamination between different product analyses
            del fresh_agent
            
            return {
                "analysis_type": "combined",
                "images": uploaded_images,
                "total_images": len(uploaded_images),
                "analysis": response,
                "status": "success"
            }
        
        else:
            # Analyze each image separately with fresh agent instances
            individual_analyses = []
            
            for img in uploaded_images:
                try:
                    # Create a fresh agent instance for each image to prevent context contamination
                    fresh_agent = create_fresh_agent()
                    if not fresh_agent:
                        raise Exception("Failed to initialize AI agent")
                    
                    prompt = f"""Be a balanced auction verifier. Analyze this product image using `analyze_image` to detect authenticity — start cautiously (the seller *might* use stock/AI images) but remain fair and evidence-driven. 
                    Check EXIF, lighting, background, watermarks, and editing artifacts. Compare with similar items (DB + web) to suggest a reasonable price range, lowering estimates for used or suspicious listings. 
                    Rate auction quality (0–10) for authenticity, clarity, and technical quality, and provide a short justification and recommended action (accept/manual_review/reject/request_better_images).

                    
                    If the images look too polished or reused, recommend manual review or reject.
                    
                    Image URL: {img['url']}
                    Image filename: {img['filename']}
                    """
                    if description:
                        prompt += f"Additional context: {description}. "
                    prompt += f"Use the analyze_image tool to get detailed analysis."
                    
                    analysis = fresh_agent(prompt)
                    
                    # IMPORTANT: Clear the agent reference to allow garbage collection
                    # Each image gets its own fresh agent to prevent context contamination
                    del fresh_agent
                    
                    individual_analyses.append({
                        "filename": img["filename"],
                        "url": img["url"],
                        "analysis": analysis
                    })
                    
                except Exception as e:
                    individual_analyses.append({
                        "filename": img["filename"],
                        "url": img["url"],
                        "analysis": {"error": str(e)},
                        "status": "failed"
                    })
            
            return {
                "analysis_type": "individual",
                "images": uploaded_images,
                "total_images": len(uploaded_images),
                "individual_analyses": individual_analyses,
                "status": "success"
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def send_winner_email(user_email: str, username: str, item_name: str, message: str):
    """
    Send winner notification email using Gmail SMTP
    """
    try:
        # Get Gmail app password from environment
        gmail_password = os.getenv('GMAIL_APP_PASSWORD')
        if not gmail_password:
            raise ValueError("GMAIL_APP_PASSWORD not found in environment variables")
        
        print(f"Gmail App Password: {gmail_password}")
        
        # Create email message
        msg = EmailMessage()
        msg["From"] = "throwawayemail4235@gmail.com"
        msg["To"] = user_email
        msg["Subject"] = "You Won!! - WIWI Raffle"
        # Set both HTML and plain text content
        msg.set_content(message, subtype='html')
        
        # Send email using SMTP
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as smtp:
            smtp.ehlo()
            smtp.starttls()          # upgrade to TLS
            smtp.ehlo()
            smtp.login("throwawayemail4235@gmail.com", gmail_password)
            smtp.send_message(msg)
            
        return {"status": "success", "message": "Email sent successfully"}
        
    except Exception as e:
        print(f"Email sending failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

def send_raffle_winner_email(winner_email: str, item_title: str, seller_email: str, 
                           ticket_cost: int, tickets_spent: int, charity_overflow: int = 0):
    """
    Send raffle winner notification email with detailed information
    """
    try:
        # Get Gmail app password from environment
        gmail_password = os.getenv('GMAIL_APP_PASSWORD')
        if not gmail_password:
            raise ValueError("GMAIL_APP_PASSWORD not found in environment variables")
        
        # Create HTML email content
        charity_message = ""
        if charity_overflow > 0:
            charity_message = f"""
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <h3 style="color: #92400e; margin: 0 0 8px 0;">🎉 Bonus: Charity Overflow Active!</h3>
                <p style="color: #92400e; margin: 0;">This raffle exceeded its goal by {charity_overflow} tickets, supporting charity!</p>
            </div>
            """
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>You Won! - WIWI Raffle</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 2.5em;">🎉 Congratulations! 🎉</h1>
                <h2 style="margin: 10px 0 0 0; font-size: 1.5em;">You Won the Raffle!</h2>
            </div>
            
            <div style="background-color: #f8fafc; border-radius: 10px; padding: 25px; margin-bottom: 20px;">
                <h3 style="color: #1e293b; margin-top: 0;">🏆 Prize Details</h3>
                <p style="font-size: 1.2em; margin: 10px 0;"><strong>Item:</strong> {item_title}</p>
                <p style="margin: 10px 0;"><strong>Your Tickets:</strong> {tickets_spent} tickets (${ticket_cost} each)</p>
                <p style="margin: 10px 0;"><strong>Total Investment:</strong> ${tickets_spent * ticket_cost}</p>
            </div>
            
            {charity_message}
            
            <div style="background-color: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #0c4a6e; margin-top: 0;">📞 Next Steps</h3>
                <p style="color: #0c4a6e; margin: 10px 0;">The seller will contact you soon at: <strong>{seller_email}</strong></p>
                <p style="color: #0c4a6e; margin: 10px 0;">Please respond promptly to arrange prize delivery.</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f1f5f9; border-radius: 8px;">
                <p style="margin: 0; color: #64748b;">Thank you for participating in WIWI Raffle!</p>
                <p style="margin: 5px 0 0 0; color: #64748b;">Good luck with your new prize! 🍀</p>
            </div>
        </body>
        </html>
        """
        
        # Create email message
        msg = EmailMessage()
        msg["From"] = "throwawayemail4235@gmail.com"
        msg["To"] = winner_email
        msg["Subject"] = f"🎉 You Won: {item_title} - WIWI Raffle"
        msg.set_content(html_content, subtype='html')
        
        # Send email using SMTP
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()
            smtp.login("throwawayemail4235@gmail.com", gmail_password)
            smtp.send_message(msg)
            
        return {"status": "success", "message": "Winner notification email sent successfully"}
        
    except Exception as e:
        print(f"Winner email sending failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send winner email: {str(e)}")

@app.post("/send-winner-email")
def send_winner_notification(request: EmailRequest):
    """
    Send winner notification email to user
    """
    try:
        result = send_winner_email(
            user_email=request.user_email,
            username=request.username,
            item_name=request.item_name,
            message=request.message
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/send-raffle-winner-email")
def send_raffle_winner_notification(request: RaffleWinnerRequest):
    """
    Send raffle winner notification email with detailed information
    """
    try:
        result = send_raffle_winner_email(
            winner_email=request.winner_email,
            item_title=request.item_title,
            seller_email=request.seller_email,
            ticket_cost=request.ticket_cost,
            tickets_spent=request.tickets_spent,
            charity_overflow=request.charity_overflow
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/mongodb/test")
def test_mongodb():
    try:
        # Test database operations
        from db_connection import get_sync_db
        db = get_sync_db()
        test_db = client["test_db"]
        collection = test_db["test_collection"]
        
        # Insert a test document
        result = collection.insert_one({"test": "MongoDB connection working", "timestamp": "2024"})
        
        # Find the document
        doc = collection.find_one({"_id": result.inserted_id})
        
        # Clean up
        collection.delete_one({"_id": result.inserted_id})
        
        return {
            "status": "success",
            "message": "MongoDB operations working correctly",
            "test_document": doc
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"MongoDB operations failed: {str(e)}"
        }
