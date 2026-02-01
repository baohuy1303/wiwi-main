from pydantic import BaseModel
from datetime import datetime

class User(BaseModel):
    
    _id: str
    email: str
    password: str
    role: str

    ticketBalance: int     # internal digital currency (1$ = 1 ticket)
    totalRevenue: int      # seller's earned tickets
    totalSpent: int        # buyer's tickets spent on raffles

    verified: bool         # trusted seller or not
    createdAt: datetime
    updatedAt: datetime
    