from django.contrib.auth.models import User as DjangoUser
from django.core.exceptions import ValidationError
from django.db import models

from apps.attachments.models import Attachment


HMS_TYPE_CHOICES = [
	(1, "Lodge"),
	(2, "PG"),
]


class HMS(models.Model):
	hms_name = models.CharField(max_length=64, unique=True, db_index=True)
	hms_type = models.PositiveSmallIntegerField(choices=HMS_TYPE_CHOICES)
	is_active = models.BooleanField(default=True, db_index=True)
	hms_display_name = models.CharField(max_length=120)
	auth_user = models.ForeignKey(
		DjangoUser,
		on_delete=models.PROTECT,
		related_name="owned_hms_sites",
	)
	logo_attachment = models.ForeignKey(
		Attachment,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="hms_logos",
	)
	about_hms = models.TextField(blank=True, default="")
	mobile_number = models.CharField(max_length=20, blank=True, default="")
	time_period = models.PositiveIntegerField(default=12)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)
	created_by = models.ForeignKey(
		DjangoUser,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="created_hms_records",
	)
	updated_by = models.ForeignKey(
		DjangoUser,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="updated_hms_records",
	)

	class Meta:
		db_table = "hms"
		ordering = ["-created_at"]

	def clean(self):
		if not self.hms_name:
			raise ValidationError({"hms_name": "hms_name is required"})

		if not self.hms_name.islower():
			raise ValidationError({"hms_name": "hms_name must be lowercase"})

		if not self.hms_name.isalpha():
			raise ValidationError(
				{
					"hms_name": "hms_name must contain only lowercase letters (a-z), no spaces or numbers",
				}
			)

	def __str__(self):
		return f"{self.hms_display_name} ({self.hms_name})"