#!/usr/bin/env python3
"""
Setup AWS credentials in .env file for Strands agent
"""

import os
from pathlib import Path

def setup_env_credentials():
    """Add AWS credentials to .env file"""
    env_file = Path(".env")
    
    print("🔧 Setting up AWS credentials in .env file...")
    
    # Check if .env file exists
    if not env_file.exists():
        print("❌ .env file not found. Creating one...")
        env_file.touch()
    
    # Read current .env content
    with open(env_file, 'r') as f:
        content = f.read()
    
    # Check if AWS credentials are already present
    if 'AWS_ACCESS_KEY_ID' in content:
        print("✅ AWS credentials already present in .env file")
        return
    
    # Add AWS credentials section
    aws_section = """

# AWS Credentials for Strands Agent
# Uncomment and fill in your AWS credentials
# AWS_ACCESS_KEY_ID=your_access_key_here
# AWS_SECRET_ACCESS_KEY=your_secret_key_here
# AWS_DEFAULT_REGION=us-west-2
"""
    
    # Append to .env file
    with open(env_file, 'a') as f:
        f.write(aws_section)
    
    print("✅ AWS credentials section added to .env file")
    print("\n📝 Next steps:")
    print("1. Edit the .env file and uncomment the AWS credentials lines")
    print("2. Replace 'your_access_key_here' with your actual AWS Access Key ID")
    print("3. Replace 'your_secret_key_here' with your actual AWS Secret Access Key")
    print("4. Set the region (default: us-west-2)")
    print("\nExample:")
    print("AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE")
    print("AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY")
    print("AWS_DEFAULT_REGION=us-west-2")

def test_env_loading():
    """Test if credentials are loaded from .env file"""
    from dotenv import load_dotenv
    import os
    
    print("\n🧪 Testing .env file loading...")
    load_dotenv()
    
    access_key = os.getenv('AWS_ACCESS_KEY_ID')
    secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
    region = os.getenv('AWS_DEFAULT_REGION')
    
    if access_key and access_key != 'your_access_key_here':
        print("✅ AWS_ACCESS_KEY_ID loaded from .env")
    else:
        print("❌ AWS_ACCESS_KEY_ID not found or not set")
    
    if secret_key and secret_key != 'your_secret_key_here':
        print("✅ AWS_SECRET_ACCESS_KEY loaded from .env")
    else:
        print("❌ AWS_SECRET_ACCESS_KEY not found or not set")
    
    if region:
        print(f"✅ AWS_DEFAULT_REGION loaded from .env: {region}")
    else:
        print("❌ AWS_DEFAULT_REGION not found or not set")

if __name__ == "__main__":
    setup_env_credentials()
    test_env_loading()
