import os
import requests
from dotenv import load_dotenv

load_dotenv()
# Hardcoded values
WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")
PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
TO_PHONE = "917799597377"
TEMPLATE_NAME = "hms_otp"
OTP_CODE = "123456"

GRAPH_API_URL = f"https://graph.facebook.com/v25.0/{PHONE_NUMBER_ID}/messages"

payload = {
    "messaging_product": "whatsapp",
    "to": TO_PHONE,
    "type": "template",
    "template": {
        "name": TEMPLATE_NAME,
        "language": {"code": "en_US"},
        "components": [
            {
                "type": "body",
                "parameters": [
                    {"type": "text", "text": OTP_CODE}
                ]
            },
            {
                "type": "button",
                "sub_type": "url",
                "index": "0",
                "parameters": [
                    {"type": "text", "text": OTP_CODE}
                ]
            }
        ]
    }
}

headers = {
    "Authorization": f"Bearer {WHATSAPP_TOKEN}",
    "Content-Type": "application/json"
}

response = requests.post(GRAPH_API_URL, json=payload, headers=headers)

print("Status Code:", response.status_code)
print("Response:", response.json())