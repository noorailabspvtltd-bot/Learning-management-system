from django.utils import timezone
from rest_framework import serializers

from .models import Assignment


class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = [
            "id",
            "title",
            "description",
            "due_date",
            "max_marks",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_due_date(self, value):
        is_new = self.instance is None
        changed = not is_new and value != self.instance.due_date
        if (is_new or changed) and value < timezone.now():
            raise serializers.ValidationError("Due date cannot be in the past.")
        return value

    def validate_max_marks(self, value):
        if value <= 0:
            raise serializers.ValidationError("Maximum marks must be greater than 0.")
        return value