# tools/order_tool.py
from strands import tool

@tool
def place_order(product_id: int, quantity: int, confirm: bool = False) -> str:
    """
    Place an order for the given product ID.
    Only proceed if confirm=True.
    """
    if not confirm:
        return "Order not placed. User confirmation required."
    return f"✅ Order placed successfully for product {product_id}, quantity {quantity}."
