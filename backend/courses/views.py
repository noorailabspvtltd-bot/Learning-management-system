from rest_framework import viewsets
from .models import PracticeCourse
from .serializers import PracticeCourseSerializer


class PracticeCourseViewSet(viewsets.ModelViewSet):
    queryset = PracticeCourse.objects.all().order_by("-created_at")
    serializer_class = PracticeCourseSerializer