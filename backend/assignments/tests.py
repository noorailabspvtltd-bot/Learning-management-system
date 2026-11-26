from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Assignment


class AssignmentAPITests(APITestCase):
    def setUp(self):
        self.assignment = Assignment.objects.create(
            title="Existing assignment",
            description="Created for the tests",
            due_date=timezone.now() + timedelta(days=7),
            max_marks=50,
        )
        self.list_url = reverse("assignment-list")

    def test_list_assignments(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_create_assignment(self):
        data = {
            "title": "New assignment",
            "description": "Written by a test",
            "due_date": (timezone.now() + timedelta(days=3)).isoformat(),
            "max_marks": 20,
        }
        response = self.client.post(self.list_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Assignment.objects.count(), 2)
        self.assertEqual(response.data["status"], "draft")

    def test_reject_past_due_date(self):
        data = {
            "title": "Late",
            "description": "Past date",
            "due_date": "2020-01-01T10:00:00Z",
            "max_marks": 10,
        }
        response = self.client.post(self.list_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("due_date", response.data)

    def test_reject_zero_max_marks(self):
        data = {
            "title": "Zero",
            "description": "No marks",
            "due_date": (timezone.now() + timedelta(days=3)).isoformat(),
            "max_marks": 0,
        }
        response = self.client.post(self.list_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("max_marks", response.data)