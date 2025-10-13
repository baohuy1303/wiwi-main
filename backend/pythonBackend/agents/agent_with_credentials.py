from strands import Agent
import os
import boto3
from botocore.exceptions import NoCredentialsError
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def setup_aws_credentials():
    """Setup AWS credentials for Strands agent"""
    print("🔧 Setting up AWS credentials...")
    
    # Check if credentials are already available
    try:
        session = boto3.Session()
        credentials = session.get_credentials()
        if credentials:
            print("✅ AWS credentials found in environment")
            return True
    except NoCredentialsError:
        pass
    
    # Try to load from AWS credentials file
    try:
        session = boto3.Session(profile_name='default')
        credentials = session.get_credentials()
        if credentials:
            print("✅ AWS credentials found in ~/.aws/credentials")
            return True
    except NoCredentialsError:
        pass
    
    print("❌ No AWS credentials found")
    print("\n📋 To fix this, you have several options:")
    print("\n1. Set environment variables:")
    print("   export AWS_ACCESS_KEY_ID=your_access_key")
    print("   export AWS_SECRET_ACCESS_KEY=your_secret_key")
    print("   export AWS_DEFAULT_REGION=us-west-2")
    
    print("\n2. Configure AWS CLI:")
    print("   aws configure")
    
    print("\n3. Create ~/.aws/credentials file:")
    print("   [default]")
    print("   aws_access_key_id = your_access_key")
    print("   aws_secret_access_key = your_secret_key")
    print("   region = us-west-2")
    
    return False

def create_agent_with_fallback():
    """Create agent with fallback options"""
    print("🤖 Creating Strands agent...")
    
    # Check credentials first
    if not setup_aws_credentials():
        print("\n⚠️  Cannot create agent without AWS credentials")
        print("   Strands agent requires AWS Bedrock access")
        return None
    
    try:
        # Create agent with explicit AWS configuration
        agent = Agent(
            model="anthropic.claude-3-sonnet-20240229-v1:0",  # Specify model explicitly
            system_prompt="You are a helpful AI assistant specialized in agentic AI and automation."
        )
        print("✅ Agent created successfully!")
        return agent
    except Exception as e:
        print(f"❌ Error creating agent: {e}")
        return None

def test_agent(agent):
    """Test the agent with a simple question"""
    if not agent:
        return
    
    print("\n🧪 Testing agent...")
    try:
        response = agent("Tell me about agentic AI in 2 sentences")
        print(f"🤖 Agent response: {response}")
    except Exception as e:
        print(f"❌ Error running agent: {e}")
        print("This is likely due to missing AWS credentials or insufficient permissions")

if __name__ == "__main__":
    # Create and test the agent
    agent = create_agent_with_fallback()
    test_agent(agent)
