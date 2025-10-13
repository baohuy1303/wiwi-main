#!/usr/bin/env python3
"""
Setup script for Strands agent credentials
This script helps you configure AWS credentials for the Strands agent
"""

import os
import boto3
from botocore.exceptions import NoCredentialsError, ClientError
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def check_aws_credentials():
    """Check if AWS credentials are properly configured"""
    print("🔍 Checking AWS credentials...")
    
    try:
        # Try to create a session
        session = boto3.Session()
        credentials = session.get_credentials()
        
        if credentials:
            print("✅ AWS credentials found!")
            print(f"   Access Key ID: {credentials.access_key[:8]}...")
            print(f"   Region: {session.region_name or 'Not set'}")
            
            # Test if we can access Bedrock
            try:
                bedrock = session.client('bedrock-runtime')
                print("✅ Bedrock access confirmed!")
                return True
            except ClientError as e:
                print(f"❌ Bedrock access denied: {e}")
                return False
        else:
            print("❌ No AWS credentials found")
            return False
            
    except NoCredentialsError:
        print("❌ No AWS credentials found")
        return False
    except Exception as e:
        print(f"❌ Error checking credentials: {e}")
        return False

def setup_environment_variables():
    """Guide user through setting up environment variables"""
    print("\n📋 To set up AWS credentials, you can:")
    print("\n1. Set environment variables in your shell:")
    print("   export AWS_ACCESS_KEY_ID=your_access_key_here")
    print("   export AWS_SECRET_ACCESS_KEY=your_secret_key_here")
    print("   export AWS_DEFAULT_REGION=us-west-2")
    
    print("\n2. Add to your .env file:")
    print("   AWS_ACCESS_KEY_ID=your_access_key_here")
    print("   AWS_SECRET_ACCESS_KEY=your_secret_key_here")
    print("   AWS_DEFAULT_REGION=us-west-2")
    
    print("\n3. Use AWS CLI:")
    print("   aws configure")
    
    print("\n4. Create ~/.aws/credentials file:")
    print("   [default]")
    print("   aws_access_key_id = your_access_key_here")
    print("   aws_secret_access_key = your_secret_key_here")
    print("   region = us-west-2")

def main():
    print("🚀 Strands Agent Credentials Setup")
    print("=" * 40)
    
    if check_aws_credentials():
        print("\n🎉 Your AWS credentials are properly configured!")
        print("   You can now use the Strands agent.")
    else:
        print("\n⚠️  AWS credentials are not properly configured.")
        setup_environment_variables()
        print("\n💡 After setting up credentials, run this script again to verify.")

if __name__ == "__main__":
    main()
