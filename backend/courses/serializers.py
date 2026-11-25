from rest_framework import serializers
from .models import PracticeCourse


class PracticeCourseSerializer(serializers.ModelSerializer):

    class Meta:
        model = PracticeCourse
        fields = [
            "id",
            "title",
            "description",
            "is_published",
            "created_at"
        ]
        read_only_fields = ["id", "created_at"]