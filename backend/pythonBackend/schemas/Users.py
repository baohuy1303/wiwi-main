def user_default_data(user) -> dict:
    return {
        "_id": user["_id"],
        "email": user["email"],
        "password": user["password"],
        "role": user["role"],
        "ticketBalance": user["ticketBalance"],
        "totalRevenue": user["totalRevenue"],
        "totalSpent": user["totalSpent"],
        "verified": user["verified"],
        "createdAt": user["createdAt"],
        "updatedAt": user["updatedAt"]  
    }
def list_user_data(users) -> list:
    return [user_default_data(user) for user in users]