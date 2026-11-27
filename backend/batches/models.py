from django.db import models
from django.db.models import F, Q
from django.core.validators import MinValueValidator


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

    max_students = models.PositiveIntegerField(default=30, validators=[MinValueValidator(1)])

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PLANNED
    )

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(max_students__gte=1),
                name="batch_max_students_gte_1",
            ),
            models.CheckConstraint(
                condition=Q(end_date__gte=F("start_date")),
                name="batch_end_date_on_or_after_start",
            ),
        ]

    def _str_(self):
        return f"{self.name} ({self.batch_code})"