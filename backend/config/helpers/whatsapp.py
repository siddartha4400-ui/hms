# helpers/whatsapp.py

import os
import requests
from dotenv import load_dotenv

load_dotenv()

WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")
PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
GRAPH_API_URL = f"https://graph.facebook.com/v25.0/{PHONE_NUMBER_ID}/messages"


def send_whatsapp_template(to: str, template_name: str, variables: list = None) -> dict:
    """
    Send a WhatsApp template message using the Facebook Graph API.

    Args:
        to (str): Recipient phone number in international format (e.g., "917799597377").
        template_name (str): Name of the WhatsApp template.
        variables (list): Optional list of variable strings to populate in the template.
                          For hms_otp, pass [otp_code] – it fills both body and button URL.

    Returns:
        dict: Response from the WhatsApp API, or {"error": ...} on failure.
    """
    if not WHATSAPP_TOKEN:
        return {"error": "Missing WHATSAPP_TOKEN env variable"}
    if not PHONE_NUMBER_ID:
        return {"error": "Missing WHATSAPP_PHONE_NUMBER_ID env variable"}

    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json",
    }

    # Build components matching the hms_otp template structure:
    # - body component with the OTP text parameter
    # - button (url) component that also receives the OTP as the dynamic URL suffix
    components = []
    if variables:
        otp_value = str(variables[0])
        components = [
            {
                "type": "body",
                "parameters": [{"type": "text", "text": otp_value}],
            },
            {
                "type": "button",
                "sub_type": "url",
                "index": "0",
                "parameters": [{"type": "text", "text": otp_value}],
            },
        ]

    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": "en_US"},
            "components": components,
        },
    }

    try:
        response = requests.post(GRAPH_API_URL, json=payload, headers=headers, timeout=15)
        data = response.json()

        if not response.ok:
            error_obj = data.get("error", {}) if isinstance(data, dict) else {}
            return {
                "error": error_obj.get("message") or f"HTTP {response.status_code}",
                "status_code": response.status_code,
                "response": data,
            }

        return data

    except requests.exceptions.RequestException as e:
        return {"error": str(e)}