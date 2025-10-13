# Strands Agent Setup Guide

## ✅ **Credentials Successfully Loaded from .env File!**

Your Strands agent is now properly configured to load AWS credentials from the `.env` file.

## 🔧 **Current Status:**

- ✅ **Credentials Loading**: Working (loaded from .env file)
- ✅ **Agent Creation**: Working
- ❌ **Bedrock Access**: Permission denied (needs AWS policy update)

## 🚀 **How It Works:**

The agent now automatically loads AWS credentials from your `.env` file:

```env
# In your .env file
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_DEFAULT_REGION=us-west-2
```

## 🔑 **Current Issue: AWS Permissions**

The error you're seeing is:
```
AccessDeniedException: User is not authorized to perform: bedrock:InvokeModelWithResponseStream
```

This means your AWS credentials are valid, but the user/role doesn't have permission to use Bedrock.

## 🛠️ **Solutions:**

### **Option 1: Add Bedrock Permissions to Your AWS User/Role**

Add this policy to your AWS user or role:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream",
                "bedrock:Converse",
                "bedrock:ConverseStream"
            ],
            "Resource": "arn:aws:bedrock:*::foundation-model/*"
        }
    ]
}
```

### **Option 2: Use AWS Administrator Access (for testing)**

Temporarily attach the `AdministratorAccess` policy to test the agent.

### **Option 3: Use Different AWS Account**

If you don't have Bedrock access, you can:
1. Request Bedrock access from your AWS administrator
2. Use a different AWS account with Bedrock permissions
3. Use AWS Free Tier (if available in your region)

## 🧪 **Test Your Setup:**

1. **Check credentials:**
   ```bash
   python agents/setup_credentials.py
   ```

2. **Test agent:**
   ```bash
   python agents/agent_with_credentials.py
   ```

3. **Setup .env credentials:**
   ```bash
   python agents/setup_env_credentials.py
   ```

## 📁 **Files Created:**

- `agents/agent_with_credentials.py` - Main agent with .env loading
- `agents/setup_credentials.py` - Credential verification
- `agents/setup_env_credentials.py` - .env file setup helper
- `agents/agent.py` - Basic agent with error handling

## 🎉 **Success!**

Your Strands agent is now properly configured to load credentials from the `.env` file. The only remaining step is to ensure your AWS account has Bedrock permissions.
