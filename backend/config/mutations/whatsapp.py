# mutations/whatsapp.py

import graphene
from ..helpers.whatsapp import send_whatsapp_template

class SendWhatsappTemplate(graphene.Mutation):
    class Arguments:
        to = graphene.String(required=True)
        template_name = graphene.String(required=True)
        variables = graphene.List(graphene.String)

    success = graphene.Boolean()
    response = graphene.JSONString()

    def mutate(self, info, to, template_name, variables=None):
        # Call the helper function
        res = send_whatsapp_template(to, template_name, variables)

        # Determine success based on absence of "error" key
        success = res.get("error") is None

        # Return mutation response
        return SendWhatsappTemplate(success=success, response=res)

# Add this to your GraphQL mutation registry
class Mutation(graphene.ObjectType):
    send_whatsapp_template = SendWhatsappTemplate.Field()