from rest_framework import serializers
from .models import Batch


MAX_BATCH_STUDENTS = 500


class BatchSerializer(serializers.ModelSerializer):
    max_students = serializers.IntegerField(
        min_value=1,
        max_value=MAX_BATCH_STUDENTS,
        default=30,
        error_messages={
            "max_value": f"Capacity cannot exceed {MAX_BATCH_STUDENTS} students."
        },
    )

    class Meta:
        model = Batch
        fields = "__all__"

    def validate_status(self, value):
        creatable_statuses = {
            Batch.Status.PLANNED,
            Batch.Status.ONGOING,
        }
        if self.instance is None and value not in creatable_statuses:
            raise serializers.ValidationError(
                "New batches must have Planned or Ongoing status."
            )
        return value

    def validate(self, attrs):
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")
        if self.instance is not None:
            start_date = start_date or self.instance.start_date
            end_date = end_date or self.instance.end_date

        if start_date is not None and end_date is not None and end_date < start_date:
            raise serializers.ValidationError(
                {"end_date": "End date must be on or after the start date."}
            )

        if self.instance is not None and "status" in attrs:
            current_status = self.instance.status
            next_status = attrs["status"]
            allowed_transitions = {
                Batch.Status.PLANNED: {
                    Batch.Status.ONGOING,
                    Batch.Status.CANCELLED,
                },
                Batch.Status.ONGOING: {
                    Batch.Status.COMPLETED,
                    Batch.Status.CANCELLED,
                },
                Batch.Status.COMPLETED: set(),
                Batch.Status.CANCELLED: set(),
            }
            if next_status != current_status and next_status not in allowed_transitions.get(current_status, set()):
                raise serializers.ValidationError(
                    {
                        "status": (
                            f"A batch with status {current_status} cannot transition "
                            f"to {next_status}."
                        )
                    }
                )

        return attrs