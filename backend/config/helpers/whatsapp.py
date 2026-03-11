# helpers/whatsapp.py

import os
import requests
from dotenv import load_dotenv

load_dotenv()

WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")
PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
GRAPH_API_URL = f"https://graph.facebook.com/v25.0/{PHONE_NUMBER_ID}/messages"  # use latest version

def send_whatsapp_template(to: str, template_name: str, variables: list = None) -> dict:
    """
    Send a WhatsApp template message using the Facebook Graph API.

    Args:
        to (str): Recipient phone number in international format (e.g., "917799597377").
        template_name (str): Name of the WhatsApp template.
        variables (list): Optional list of variables to populate in the template.

    Returns:
        dict: Response from the WhatsApp API (or structured error if request fails).
    """
    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }

    # Build template components if variables exist
    components = []
    if variables:
        components = [
            {
                "type": "body",
                "parameters": [{"type": "text", "text": str(var)} for var in variables]
            }
        ]

    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": "en_US"},
            "components": components
        }
    }

    try:
        response = requests.post(GRAPH_API_URL, json=payload, headers=headers)
        return response.json()
    except requests.exceptions.RequestException as e:
        # Return structured error so GraphQL can handle it
        return {"error": str(e)}