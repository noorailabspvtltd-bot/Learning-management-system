from django.db import models


class Batch(models.Model):

    class Status(models.TextChoices):
        PLANNED = "PLANNED", "Planned"
        ONGOING = "ONGOING", "Ongoing"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    name = models.CharField(max_length=100)

    batch_code = models.CharField(
        max_length=30,
        unique=True
    )

    start_date = models.DateField()
    end_date = models.DateField()

    max_students = models.PositiveIntegerField(default=30)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PLANNED
    )

    def _str_(self):
        return f"{self.name} ({self.batch_code})"