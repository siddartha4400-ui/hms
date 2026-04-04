from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("attachments", "0001_initial"),
        ("propertys", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="building",
            name="bathroom_image_attachment",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="bathroom_image_for_buildings",
                to="attachments.attachment",
            ),
        ),
        migrations.AddField(
            model_name="building",
            name="building_image_attachment",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="building_image_for_buildings",
                to="attachments.attachment",
            ),
        ),
        migrations.AddField(
            model_name="building",
            name="floor_image_attachment",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="floor_image_for_buildings",
                to="attachments.attachment",
            ),
        ),
        migrations.AddField(
            model_name="building",
            name="room_image_attachment",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="room_image_for_buildings",
                to="attachments.attachment",
            ),
        ),
    ]
