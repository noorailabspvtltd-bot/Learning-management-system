from rest_framework import filters, viewsets

from .models import Assignment
from .serializers import AssignmentSerializer


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all().order_by("-created_at")
    serializer_class = AssignmentSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "description"]