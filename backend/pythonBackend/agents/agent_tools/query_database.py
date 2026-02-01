# tools/query_database.py
from strands import tool
import re
from typing import Dict, List, Any, Optional
import sys
from pathlib import Path

# Add parent directory to path for imports
current_dir = Path(__file__).parent
parent_dir = current_dir.parent.parent
sys.path.append(str(parent_dir))

from db_connection import get_sync_db

@tool
def query_database(query_prompt: str, collection_name: str = "items", limit: int = 50) -> Dict[str, Any]:
    """
    Query the MongoDB database based on a natural language prompt.
    
    This tool can search for auction items by:
    - Item title or description
    - Ticket cost range (e.g., "under 100 tickets", "between 50-200 tickets")
    - Category (electronics, clothing, etc.)
    - Condition (new, used, refurbished)
    - Status (live, goal_met, ended, not_met)
    - AI verification score
    - Any combination of the above
    
    Args:
        query_prompt: Natural language description of what to search for
        collection_name: MongoDB collection to search (default: "items")
        limit: Maximum number of results to return (default: 50)
    
    Returns:
        Dictionary containing search results and metadata
    """
    try:
        db = get_sync_db()
        collection = db[collection_name]
        
        # Parse the query prompt to build MongoDB query
        query_filter = _parse_query_prompt(query_prompt)
        
        # Execute the query
        results = list(collection.find(query_filter).limit(limit))
        
        # Convert ObjectId to string for JSON serialization
        for result in results:
            if '_id' in result:
                result['_id'] = str(result['_id'])
        
        return {
            "status": "success",
            "query_prompt": query_prompt,
            "collection": collection_name,
            "total_results": len(results),
            "results": results,
            "query_filter_used": query_filter
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "query_prompt": query_prompt,
            "collection": collection_name
        }

def _parse_query_prompt(prompt: str) -> Dict[str, Any]:
    """
    Parse natural language query into MongoDB filter for auction items.
    
    Args:
        prompt: Natural language search query
        
    Returns:
        MongoDB query filter dictionary
    """
    query_filter = {}
    prompt_lower = prompt.lower()
    
    # Ticket cost range detection
    ticket_patterns = [
        (r'under (\d+)\s*tickets?', 'lt'),
        (r'below (\d+)\s*tickets?', 'lt'),
        (r'less than (\d+)\s*tickets?', 'lt'),
        (r'over (\d+)\s*tickets?', 'gt'),
        (r'above (\d+)\s*tickets?', 'gt'),
        (r'more than (\d+)\s*tickets?', 'gt'),
        (r'between (\d+)\s*and (\d+)\s*tickets?', 'between'),
        (r'from (\d+)\s*to (\d+)\s*tickets?', 'between'),
        (r'(\d+)\s*-\s*(\d+)\s*tickets?', 'between')
    ]
    
    for pattern, operator in ticket_patterns:
        match = re.search(pattern, prompt_lower)
        if match:
            if operator == 'between':
                min_tickets = int(match.group(1))
                max_tickets = int(match.group(2))
                query_filter['ticketCost'] = {'$gte': min_tickets, '$lte': max_tickets}
            else:
                tickets = int(match.group(1))
                if operator == 'lt':
                    query_filter['ticketCost'] = {'$lt': tickets}
                elif operator == 'gt':
                    query_filter['ticketCost'] = {'$gt': tickets}
            break
    
    # Status detection
    status_keywords = ['live', 'active', 'ended', 'completed', 'goal met', 'not met', 'failed']
    for status in status_keywords:
        if status in prompt_lower:
            if status in ['live', 'active']:
                query_filter['status'] = 'live'
            elif status in ['ended', 'completed', 'goal met']:
                query_filter['status'] = 'goal_met'
            elif status in ['not met', 'failed']:
                query_filter['status'] = 'not_met'
            break
    
    # Category detection
    category_keywords = ['electronics', 'phone', 'laptop', 'tablet', 'headphones', 'camera', 'watch', 'shoes', 'clothing', 'accessories', 'gaming', 'books', 'furniture']
    for category in category_keywords:
        if category in prompt_lower:
            query_filter['category'] = {'$in': [{'$regex': category, '$options': 'i'}]}
            break
    
    # Condition detection
    condition_keywords = ['new', 'used', 'refurbished', 'damaged', 'excellent', 'good', 'fair', 'mint']
    for condition in condition_keywords:
        if condition in prompt_lower:
            query_filter['condition'] = {'$regex': condition, '$options': 'i'}
            break
    
    # AI verification score detection
    ai_score_patterns = [
        (r'ai score (over|above) (\d+)', 'gt'),
        (r'ai score (under|below) (\d+)', 'lt'),
        (r'high ai score', 'high'),
        (r'low ai score', 'low')
    ]
    
    for pattern, operator in ai_score_patterns:
        match = re.search(pattern, prompt_lower)
        if match:
            if operator == 'gt':
                score = int(match.group(2))
                query_filter['aiVerificationScore'] = {'$gt': score}
            elif operator == 'lt':
                score = int(match.group(2))
                query_filter['aiVerificationScore'] = {'$lt': score}
            elif operator == 'high':
                query_filter['aiVerificationScore'] = {'$gte': 8}
            elif operator == 'low':
                query_filter['aiVerificationScore'] = {'$lte': 5}
            break
    
    # Popularity/participation detection
    if 'popular' in prompt_lower or 'many participants' in prompt_lower:
        query_filter['ticketsSold'] = {'$gt': 10}
    elif 'new' in prompt_lower and 'auction' in prompt_lower:
        query_filter['ticketsSold'] = {'$lt': 5}
    
    # General text search across multiple fields
    if not query_filter:  # If no specific patterns found, do general text search
        search_terms = prompt.split()
        if search_terms:
            # Create a text search across title, description, and category fields
            text_query = {
                '$or': [
                    {'title': {'$regex': '|'.join(search_terms), '$options': 'i'}},
                    {'description': {'$regex': '|'.join(search_terms), '$options': 'i'}},
                    {'category': {'$in': [{'$regex': '|'.join(search_terms), '$options': 'i'}]}}
                ]
            }
            query_filter.update(text_query)
    
    return query_filter

@tool
def get_item_by_id(item_id: str, collection_name: str = "items") -> Dict[str, Any]:
    """
    Get a specific auction item by its ID.
    
    Args:
        item_id: The ID of the item to retrieve
        collection_name: MongoDB collection to search (default: "items")
    
    Returns:
        Dictionary containing the item information
    """
    try:
        from bson import ObjectId
        db = get_sync_db()
        collection = db[collection_name]
        
        # Try to find by ObjectId first, then by string ID
        try:
            item = collection.find_one({"_id": ObjectId(item_id)})
        except:
            item = collection.find_one({"id": item_id})
        
        if item and '_id' in item:
            item['_id'] = str(item['_id'])
        
        return {
            "status": "success",
            "item": item,
            "item_id": item_id
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "item_id": item_id
        }

@tool
def get_items_by_category(category: str, limit: int = 20) -> Dict[str, Any]:
    """
    Get all auction items in a specific category.
    
    Args:
        category: Item category to search for
        limit: Maximum number of results to return
    
    Returns:
        Dictionary containing items in the category
    """
    try:
        db = get_sync_db()
        collection = db["items"]
        
        query_filter = {
            'category': {'$in': [{'$regex': category, '$options': 'i'}]}
        }
        
        results = list(collection.find(query_filter).limit(limit))
        
        # Convert ObjectId to string
        for result in results:
            if '_id' in result:
                result['_id'] = str(result['_id'])
        
        return {
            "status": "success",
            "category": category,
            "total_results": len(results),
            "items": results
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "category": category
        }

@tool
def get_database_stats() -> Dict[str, Any]:
    """
    Get statistics about the database collections and data.
    
    Returns:
        Dictionary containing database statistics
    """
    try:
        db = get_sync_db()
        
        # Get collection names
        collections = db.list_collection_names()
        
        stats = {}
        for collection_name in collections:
            collection = db[collection_name]
            count = collection.count_documents({})
            stats[collection_name] = {
                "document_count": count
            }
            
            # Get sample document structure for products collection
            if collection_name == "products" and count > 0:
                sample = collection.find_one()
                if sample:
                    stats[collection_name]["sample_fields"] = list(sample.keys())
        
        return {
            "status": "success",
            "database": "hackmidwest",
            "collections": stats
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

@tool
def get_live_auctions(limit: int = 20) -> Dict[str, Any]:
    """
    Get all currently live auction items.
    
    Args:
        limit: Maximum number of results to return
    
    Returns:
        Dictionary containing live auction items
    """
    try:
        db = get_sync_db()
        collection = db["items"]
        
        query_filter = {
            'status': 'live'
        }
        
        results = list(collection.find(query_filter).limit(limit))
        
        # Convert ObjectId to string
        for result in results:
            if '_id' in result:
                result['_id'] = str(result['_id'])
        
        return {
            "status": "success",
            "total_results": len(results),
            "live_auctions": results
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

@tool
def get_auctions_by_ticket_cost(min_tickets: int, max_tickets: int, limit: int = 20) -> Dict[str, Any]:
    """
    Get auction items within a specific ticket cost range.
    
    Args:
        min_tickets: Minimum ticket cost
        max_tickets: Maximum ticket cost
        limit: Maximum number of results to return
    
    Returns:
        Dictionary containing items in the ticket cost range
    """
    try:
        db = get_sync_db()
        collection = db["items"]
        
        query_filter = {
            'ticketCost': {'$gte': min_tickets, '$lte': max_tickets}
        }
        
        results = list(collection.find(query_filter).limit(limit))
        
        # Convert ObjectId to string
        for result in results:
            if '_id' in result:
                result['_id'] = str(result['_id'])
        
        return {
            "status": "success",
            "ticket_range": f"{min_tickets}-{max_tickets}",
            "total_results": len(results),
            "items": results
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "ticket_range": f"{min_tickets}-{max_tickets}"
        }

@tool
def get_high_ai_score_items(min_score: float = 8.0, limit: int = 20) -> Dict[str, Any]:
    """
    Get auction items with high AI verification scores.
    
    Args:
        min_score: Minimum AI verification score (default: 8.0)
        limit: Maximum number of results to return
    
    Returns:
        Dictionary containing high-quality verified items
    """
    try:
        db = get_sync_db()
        collection = db["items"]
        
        query_filter = {
            'aiVerificationScore': {'$gte': min_score}
        }
        
        results = list(collection.find(query_filter).limit(limit))
        
        # Convert ObjectId to string
        for result in results:
            if '_id' in result:
                result['_id'] = str(result['_id'])
        
        return {
            "status": "success",
            "min_ai_score": min_score,
            "total_results": len(results),
            "high_quality_items": results
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "min_ai_score": min_score
        }
