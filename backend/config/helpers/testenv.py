# test.py
import requests

# Hardcoded values (replace with your actual token, phone number, and template)
WHATSAPP_TOKEN = "EAAM4yqnol78BQ6K1LxhgoyKosZBRbjgILrkBQ27gL6nn43iZCT9m2k9AjBunuZCLUBQ7QLrZCP49QVtBjLYUANNXpzZCNSYuE2XodlUbmCiSu1yZC3w8zbivtpckfyexwOqYEWpZBAdIBLW6pZCZCTsVYJP1wku938XUKtMRue0EM3HfAqcvSm9uv37GcHwEcZB66B1vyl1kk7w1Wz2ZAdR6HOhVaMhmgt50hkvuww2"
PHONE_NUMBER_ID = "1026233740568781"  # Replace with your WhatsApp phone number ID
TO_PHONE = "917799597377"             # Recipient number in international format
TEMPLATE_NAME = "hello_world"         # WhatsApp template name

GRAPH_API_URL = f"https://graph.facebook.com/v25.0/{PHONE_NUMBER_ID}/messages"

payload = {
    "messaging_product": "whatsapp",
    "to": TO_PHONE,
    "type": "template",
    "template": {
        "name": TEMPLATE_NAME,
        "language": {"code": "en_US"}
    }
}

headers = {
    "Authorization": f"Bearer {WHATSAPP_TOKEN}",
    "Content-Type": "application/json"
}

response = requests.post(GRAPH_API_URL, json=payload, headers=headers)

try:
    print(response.json())
except ValueError:
    print("Response not JSON:", response.text)