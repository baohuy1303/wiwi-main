## 🛠️ Tech Stack & Tools

### 🤖 AI & Machine Learning Layer
| Technology | Version | Purpose |
|-----------|---------|---------|
| **AWS Strands Agents** | 1.12.0 | Multi-agent orchestration framework |
| **Strands Agent Tools** | 0.2.11 | Custom tool integrations (DB, vision, web) |
| **Strands Agent Builder** | 0.1.10 | Agent construction and management |
| **Amazon Bedrock** | Latest | Serverless AI foundation models |
| **Claude 3.5 Sonnet** | Latest | Primary reasoning model |
| **Claude 3 Haiku** | Latest | Vision analysis model |
| **AWS Boto3** | 1.40.50 | AWS SDK for Python |
| **Pillow** | 11.2.1 | Image processing and manipulation |

### 🎨 Frontend Stack
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.3.1 | UI framework with TypeScript |
| **Vite** | 6.0.11 | Lightning-fast build tool |
| **HeroUI** | 2.8.5 | Modern React component library |
| **TailwindCSS** | 4.1.11 | Utility-first CSS framework |
| **Framer Motion** | 11.18.2 | Smooth animations & transitions |
| **Stripe.js** | 8.0.0 | Client-side payment processing |
| **Axios** | 1.12.2 | HTTP client for API calls |
| **React Router** | 6.23.0 | Client-side routing |
| **FontAwesome** | 7.1.0 | Icon library |
| **React Markdown** | 10.1.0 | Markdown rendering for AI responses |

### ⚙️ Backend Stack (Node.js)
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Express** | 5.1.0 | Web application framework |
| **Mongoose** | 8.19.1 | MongoDB object modeling |
| **Stripe** | 19.1.0 | Server-side payment processing |
| **Node-Cron** | 4.2.1 | Automated task scheduling |
| **CORS** | 2.8.5 | Cross-origin resource sharing |
| **Dotenv** | 17.2.3 | Environment variable management |

### 🐍 Backend Stack (Python)
| Technology | Version | Purpose |
|-----------|---------|---------|
| **FastAPI** | 0.118.3 | Modern async web framework |
| **Uvicorn** | 0.37.0 | ASGI server implementation |
| **Motor** | 3.7.1 | Async MongoDB driver |
| **PyMongo** | 4.15.3 | Sync MongoDB driver |
| **Pydantic** | 2.12.0 | Data validation & settings |
| **HTTPX** | 0.28.1 | Async HTTP client |
| **BeautifulSoup4** | 4.14.2 | Web scraping for price research |
| **Python-Multipart** | 0.0.20 | Multipart form data handling |

### 🗄️ Database & Storage
| Technology | Version | Purpose |
|-----------|---------|---------|
| **MongoDB** | 6.20.0 | Primary NoSQL database |
| **AWS S3** | Via Boto3 | Image & asset storage |
| **Mongoose Schema** | - | Data modeling & validation |
| **Motor** | 3.7.1 | Async DB operations |

### 🔧 Other Tools
| Technology | Purpose |
|-----------|---------|
| **Git + Gitlab** | Version control |
| **npm/pip** | Package management |
| **ESLint** | Code linting (JavaScript) |
| **Prettier** | Code formatting |
| **TypeScript** | Static type checking |
| **Python venv** | Virtual environments |
| **Stripe API** | Payment processing & subscriptions |
| **AWS IAM** | Access control & authentication |
| **Environment Variables** | Secure credential management |
| **CORS Policies** | API security |
| **PCI Compliance** | Handled by Stripe |


## 📦 Installation

### Prerequisites
- Node.js >= 18.0.0
- Python >= 3.9
- MongoDB (local or Atlas)
- AWS Account (for AI features and S3)
- Stripe Account
- Gmail App Password (for email notifications)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/test-repo.git
cd test-repo
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```

Create `.env` file in `frontend/`:
```env
VITE_API_URL=http://localhost:3000
VITE_PYTHON_API_URL=http://localhost:8000
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
```

### 3. Node.js Backend Setup
```bash
cd server
npm install
```

Create `.env` file in `server/`:
```env
ATLAS_URI=mongodb://localhost:27017/wiwi
# or use MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/wiwi

STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
PORT=3000
```

### 4. Python Backend Setup
```bash
cd backend/pythonBackend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` file in `backend/pythonBackend/`:
```env
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/wiwi

# AWS Credentials for AI and S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_DEFAULT_REGION=us-west-2
S3_BUCKET_NAME=your-s3-bucket-name

(The keys and password you see in our files won't work because it is revoked)

# Email Configuration
GMAIL_APP_PASSWORD=your_gmail_app_password
```

### 5. AWS Setup (for AI Features)

#### Enable AWS Bedrock Access
1. Log into AWS Console
2. Navigate to IAM → Users/Roles
3. Add this policy for Bedrock access:

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
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

#### Create S3 Bucket
```bash
aws s3 mb s3://your-bucket-name --region us-west-2
```

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
```
Access at: http://localhost:5173

**Terminal 2 - Node.js Backend:**
```bash
cd server
node index.js
# or with nodemon:
npm run dev
```
Access at: http://localhost:3000

**Terminal 3 - Python Backend:**
```bash
cd backend/pythonBackend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Access at: http://localhost:8000

## 📚 API Documentation

### Node.js Backend (Port 3000)

#### User Endpoints
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user

#### Raffle Endpoints
- `GET /api/items` - Get all raffles
- `GET /api/items/random/:count` - Get random raffles
- `GET /api/items/:id` - Get raffle by ID
- `POST /api/items` - Create new raffle
- `PUT /api/items/:id` - Update raffle
- `POST /api/items/:id/buy-tickets` - Purchase raffle tickets

#### Stripe Endpoints
- `POST /api/stripe/create-customer` - Create Stripe customer
- `POST /api/stripe/attach-payment-method` - Attach payment method
- `POST /api/stripe/purchase-currency` - Purchase ticket packages
- `GET /api/stripe/customer/:userId` - Get customer info
- `GET /api/stripe/packages` - Get available packages
- `GET /api/stripe/transactions/:userId` - Transaction history

#### Cron Jobs
- `POST /api/cron/process-ended-raffles` - Manual trigger for raffle processing

### Python Backend (Port 8000)

#### AI Chat
- `POST /agent/chats` - Send message to AI agent
  ```json
  {
    "prompt": "What raffles are available?"
  }
  ```

#### Image Analysis
- `POST /agent/analyze_images` - Analyze product images
  - **Multipart Form Data:**
    - `images`: Image files (max 10)
    - `title`: Product title
    - `description`: Product description
    - `condition`: Product condition
    - `analyze_together`: Boolean (analyze as set or individually)

#### Email Notifications
- `POST /send-winner-email` - Send basic winner notification
- `POST /send-raffle-winner-email` - Send detailed winner notification
  ```json
  {
    "winner_email": "winner@example.com",
    "item_title": "MacBook Air M3",
    "seller_email": "seller@example.com",
    "ticket_cost": 5,
    "tickets_spent": 10,
    "charity_overflow": 50
  }
  ```

#### Health Checks
- `GET /` - API status
- `GET /health` - Health check
- `GET /mongodb/test` - Test MongoDB connection



## 🚧 Known Issues & Limitations

- Anything AI and AWS related requires AWS Bedrock access (paid service)
- Email notifications use Gmail SMTP (app password required)
- Cron jobs run hourly (can be adjusted in `cronJobs.js`)
- Maximum 10 images per raffle
- Test mode only supports Stripe test tokens
- No JWT authentication implemented yet

## 🗺️ We will add these after the hackathon

- [ ] Add user authentication with JWT
- [ ] Implement real-time notifications (WebSockets)
- [ ] Add payment history export
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Social media integration
- [ ] Advanced analytics dashboard
- [ ] Automated charity disbursement
- [ ] Blockchain integration for transparency
