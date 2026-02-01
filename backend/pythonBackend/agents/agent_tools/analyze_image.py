# tools/analyze_image.py
from strands import tool
import base64
from io import BytesIO
from PIL import Image
import requests
import boto3
import json
from botocore.exceptions import ClientError
import os
from dotenv import load_dotenv

load_dotenv()


def analyze_with_bedrock_claude(image_base64: str) -> str:
    """
    Use AWS Bedrock Claude 3.5 Sonnet for image analysis
    Fresh model instance for each request - no memory persistence
    """
    try:
        # Create fresh Bedrock client for each request to reset model state
        bedrock_runtime = boto3.client(
            service_name='bedrock-runtime',
            region_name=os.getenv('AWS_DEFAULT_REGION', 'us-west-2')
        )
        
        # Generate unique session ID to ensure model reset
        import time
        session_id = f"session_{int(time.time() * 1000000)}"
        
        claude_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 10000,
            "system": f"You are a completely fresh AI model with no memory. Session ID: {session_id}. Each request is completely independent. Do not reference, remember, or use any information from previous requests. Analyze only the current image provided. Return only valid JSON as requested.",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": image_base64
                            }
                        },
                        {
                            "type": "text",
                            "text": """Analyze this product image for auction quality assessment.

                            Never include markdown, code blocks, or explanations.
                            Always return valid JSON (double quotes, proper commas, no trailing commas).
                            Do not wrap the JSON inside text or additional formatting.
                            Ticket Goal is the goal of the auction and ticket cost is the cost per ticket. Ticket Cost can go as low as $1 but never over 50\% of the item's value(ticket goal).

                            Provide a detailed analysis of this product in the following format:

                            1. AI verification score (1-10)
                            2. category (one or many) from this list ['Electronics', 'Gaming', 'Sports', 'Collectibles', 'Furniture', 'Toys', 'Gadgets', 'Audio', 'Wearables', 'Arts & Crafts', 'Beauty', 'Fragrance', 'Other', 'Home', 'Clothing', 'Books']
                            3. Write Title for the auction listing
                            4. Write Descriptions for the auction listing
                            5. Give Ticket Price and Ticket Goal (1$ = 1 ticket)

                            Format your response as a structured JSON object.
                            
                            populate these fields in the JSON object: 
                                "ai_verification_score": number,
                                "category": pull from the list above,
                                "title": generate a title for the product,
                                "description": Generate a description
                                "ticket_price": calculate the ticket price based on the item's value,
                                "ticket_goal": calculate the ticket goal based on the item's value,
                            
                            """
                        }
                    ]
                }
            ]
        }
        
        response = bedrock_runtime.invoke_model(
            modelId="anthropic.claude-3-5-sonnet-20241022-v2:0",
            body=json.dumps(claude_body)
        )
        
        response_body = json.loads(response['body'].read())
        analysis_text = response_body['content'][0]['text']
        
        # Return the raw text response from LLM
        return analysis_text
        
    except ClientError as e:
        print(f"Bedrock error: {e}")
        return {"error": f"AI analysis failed: {str(e)}"}
    except Exception as e:
        print(f"Analysis error: {e}")
        return {"error": f"Analysis failed: {str(e)}"}

@tool
def analyze_image(image_url: str) -> dict:
    """
    Analyze a product image for auction quality rating using AWS Bedrock AI.
    Input: Image URL (S3 or other accessible URL).
    Output: Detailed product analysis with auction quality score and recommendations.
    """
    try:
        # Download image from URL
        response = requests.get(image_url)
        response.raise_for_status()
        
        # Open image and get basic properties
        image = Image.open(BytesIO(response.content))
        width, height = image.size
        file_size_kb = round(len(response.content) / 1024, 2)
        
        # Convert image to base64 for Bedrock
        image_base64 = base64.b64encode(response.content).decode('utf-8')
        
        # Get AI analysis from Bedrock
        ai_analysis = analyze_with_bedrock_claude(image_base64)
        
        # Parse the JSON response and add the image URL
        try:
            analysis_dict = json.loads(ai_analysis)
            analysis_dict["images"] = [image_url]
            return json.dumps(analysis_dict)
        except json.JSONDecodeError:
            # If not valid JSON, return the raw analysis with image URL added
            return ai_analysis
        
    except Exception as e:
        return {
            "error": f"Image analysis failed: {str(e)}",
            "image_url": image_url,
            "recommendations": ["Please ensure image URL is accessible", "Try uploading a different image"],
            "fallback_analysis": {
                "ai_verification_score": 5.0,
                "recommended_ticket_cost": 25,
                "quality_tier": "Low",
                "market_demand": "Low"
            }
        }
