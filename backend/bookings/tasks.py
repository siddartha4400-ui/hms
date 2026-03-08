from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


@shared_task
def send_booking_confirmation(booking_id):
    """Send email confirmation when a booking is confirmed."""
    from .models import Booking

    try:
        booking = Booking.objects.select_related("guest", "room", "room__building").get(pk=booking_id)
    except Booking.DoesNotExist:
        return f"Booking {booking_id} not found"

    subject = f"Booking Confirmation - Room {booking.room.number}"
    message = (
        f"Dear {booking.guest.name},\n\n"
        f"Your booking has been confirmed.\n\n"
        f"Details:\n"
        f"  Room: {booking.room.number} ({booking.room.building.name})\n"
        f"  Check-in: {booking.check_in}\n"
        f"  Check-out: {booking.check_out}\n"
        f"  Total: ${booking.total_price or 'TBD'}\n\n"
        f"Thank you for choosing our hotel!"
    )

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [booking.guest.email],
        fail_silently=True,
    )
    return f"Confirmation sent for booking {booking_id}"


@shared_task
def send_checkout_reminder(booking_id):
    """Send checkout reminder to guest."""
    from .models import Booking

    try:
        booking = Booking.objects.select_related("guest", "room").get(pk=booking_id)
    except Booking.DoesNotExist:
        return f"Booking {booking_id} not found"

    subject = f"Checkout Reminder - Room {booking.room.number}"
    message = (
        f"Dear {booking.guest.name},\n\n"
        f"This is a reminder that your checkout date is {booking.check_out}.\n"
        f"Room: {booking.room.number}\n\n"
        f"Please contact the front desk if you need a late checkout.\n\n"
        f"Thank you!"
    )

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [booking.guest.email],
        fail_silently=True,
    )
    return f"Checkout reminder sent for booking {booking_id}"


@shared_task
def check_expired_bookings():
    """Mark overdue pending bookings as cancelled."""
    from django.utils import timezone
    from .models import Booking

    today = timezone.now().date()
    expired = Booking.objects.filter(
        status="pending",
        check_in__lt=today,
    )
    count = expired.update(status="cancelled")
    return f"Cancelled {count} expired pending bookings"
