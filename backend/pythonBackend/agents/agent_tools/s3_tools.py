import boto3
import uuid
from botocore.exceptions import NoCredentialsError
from dotenv import load_dotenv
import os
load_dotenv()

AWS_REGION = os.getenv("AWS_DEFAULT_REGION", "us-west-2")
S3_BUCKET = os.getenv("S3_BUCKET", "").strip()

if not S3_BUCKET:
    raise Exception("S3_BUCKET environment variable is required")

s3 = boto3.client("s3", region_name=AWS_REGION)

def upload_to_s3(file, filename: str):
    """Upload file-like object to S3 and return its URL."""
    try:
        # Generate unique key
        key = f"uploads/{uuid.uuid4()}_{filename}"
        print(f"Uploading to S3: bucket={S3_BUCKET}, region={AWS_REGION}, key={key}")
        
        # Upload without ACL (bucket policy handles public access)
        s3.upload_fileobj(file, S3_BUCKET, key)
        url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{key}"
        print(f"Upload successful: {url}")
        return url
    except NoCredentialsError:
        raise Exception("AWS credentials not found.")
    except Exception as e:
        raise Exception(f"S3 upload failed: {str(e)}")
