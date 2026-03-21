from django.http import JsonResponse
from django.core.mail import send_mail
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt  # ✅ add this
import json
import os
from dotenv import load_dotenv

load_dotenv()

@method_decorator(csrf_exempt, name='dispatch')  # ✅ add this
class TestEmailView(View):
    def post(self, request):
        print(os.getenv('EMAIL_HOST'), os.getenv('EMAIL_PORT'), os.getenv('EMAIL_USE_TLS'), os.getenv('EMAIL_HOST_USER'), os.getenv('EMAIL_HOST_PASSWORD'))
        try:
            data = json.loads(request.body)
            to_email = data.get('to')
            subject = data.get('subject', 'Test Email from HMS')
            message = data.get('message', 'This is a test email from your HMS Django app!')

            if not to_email:
                return JsonResponse({'error': 'to email is required'}, status=400)

            send_mail(
                subject=subject,
                message=message,
                from_email=None,
                recipient_list=[to_email],
                fail_silently=False,
            )
            return JsonResponse({'success': True, 'message': f'Email sent to {to_email}'})

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)


class SubsiteAvailabilityView(View):
    def get(self, request):
        return JsonResponse(
            {
                'success': True,
                'site_available': True,
                'subsite_key': getattr(request, 'subsite_key', None),
                'company_id': getattr(request, 'company_id', None),
            }
        )