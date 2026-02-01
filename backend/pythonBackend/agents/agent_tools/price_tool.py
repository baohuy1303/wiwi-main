# tools/price_tool.py
from strands import tool

@tool
def recommend_price(product_name: str, condition: str) -> float:
    """
    Recommend a fair price based on condition.
    Returns a numeric price estimate.
    """
    base_prices = {
        "new": 1.0,
        "used": 0.7,
        "refurbished": 0.85
    }
    condition_factor = base_prices.get(condition.lower(), 1.0)
    base_price = 500  # fallback average
    return base_price * condition_factor
