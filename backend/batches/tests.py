from django.db import IntegrityError, transaction
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .models import Batch


User = get_user_model()


class BatchPermissionTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username="batch-staff",
            password="test-password",
            is_staff=True,
        )
        self.regular_user = User.objects.create_user(
            username="batch-user",
            password="test-password",
        )

    def test_anonymous_user_cannot_access_batch_endpoints(self):
        self.assertEqual(self.client.get("/api/batches/").status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            self.client.post("/api/batches/", {}).status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_non_staff_user_cannot_read_or_mutate_batches(self):
        self.client.force_authenticate(self.regular_user)

        self.assertEqual(self.client.get("/api/batches/").status_code, status.HTTP_403_FORBIDDEN)
        batch = Batch.objects.create(
            name="Protected batch",
            batch_code="PROTECTED-01",
            start_date="2026-12-01",
            end_date="2026-12-10",
            max_students=10,
        )
        self.assertEqual(
            self.client.get(f"/api/batches/{batch.pk}/").status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.post("/api/batches/", {}).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.patch(
                f"/api/batches/{batch.pk}/",
                {"status": Batch.Status.CANCELLED},
                format="json",
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.delete(f"/api/batches/{batch.pk}/").status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_staff_user_can_read_batches(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get("/api/batches/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)


class BatchCrudAndValidationTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username="batch-manager",
            password="test-password",
            is_staff=True,
        )
        self.client.force_authenticate(self.staff)
        self.payload = {
            "name": "AI Foundations",
            "batch_code": "AI-2026-01",
            "start_date": "2026-12-01",
            "end_date": "2026-12-15",
            "max_students": 20,
            "status": Batch.Status.PLANNED,
        }

    def test_staff_can_create_retrieve_update_transition_and_delete_batch(self):
        created = self.client.post("/api/batches/", self.payload, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        batch_id = created.data["id"]

        detail = self.client.get(f"/api/batches/{batch_id}/")
        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        self.assertEqual(detail.data["batch_code"], self.payload["batch_code"])

        update_payload = {**self.payload, "name": "AI Foundations Updated"}
        updated = self.client.put(
            f"/api/batches/{batch_id}/",
            update_payload,
            format="json",
        )
        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        self.assertEqual(updated.data["name"], "AI Foundations Updated")

        ongoing = self.client.patch(
            f"/api/batches/{batch_id}/",
            {"status": Batch.Status.ONGOING},
            format="json",
        )
        self.assertEqual(ongoing.status_code, status.HTTP_200_OK)
        ongoing_refresh = self.client.get(f"/api/batches/{batch_id}/")
        self.assertEqual(ongoing_refresh.data["status"], Batch.Status.ONGOING)

        completed = self.client.patch(
            f"/api/batches/{batch_id}/",
            {"status": Batch.Status.COMPLETED},
            format="json",
        )
        self.assertEqual(completed.status_code, status.HTTP_200_OK)
        completed_refresh = self.client.get(f"/api/batches/{batch_id}/")
        self.assertEqual(completed_refresh.data["status"], Batch.Status.COMPLETED)

        deleted = self.client.delete(f"/api/batches/{batch_id}/")
        self.assertEqual(deleted.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Batch.objects.filter(pk=batch_id).exists())

    def test_ongoing_batch_cannot_be_deleted(self):
        batch = Batch.objects.create(
            **{**self.payload, "status": Batch.Status.ONGOING},
        )

        response = self.client.delete(f"/api/batches/{batch.pk}/")

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertTrue(Batch.objects.filter(pk=batch.pk).exists())
        self.assertEqual(
            response.data["detail"],
            "Ongoing batches cannot be deleted. Cancel or complete the batch first.",
        )

    def test_invalid_batch_updates_are_rejected_without_changing_existing_values(self):
        batch = Batch.objects.create(**self.payload)
        invalid_updates = (
            {"end_date": "2026-11-30"},
            {"max_students": 0},
            {"max_students": 501},
        )

        for update in invalid_updates:
            with self.subTest(update=update):
                response = self.client.patch(
                    f"/api/batches/{batch.pk}/",
                    update,
                    format="json",
                )
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

                batch.refresh_from_db()
                self.assertEqual(batch.end_date.isoformat(), self.payload["end_date"])
                self.assertEqual(batch.max_students, self.payload["max_students"])

    def test_invalid_dates_and_capacity_are_rejected(self):
        invalid_payloads = [
            {**self.payload, "end_date": "2026-11-30"},
            {**self.payload, "max_students": 0},
            {**self.payload, "max_students": -1},
            {**self.payload, "max_students": 501},
        ]

        for payload in invalid_payloads:
            with self.subTest(payload=payload):
                response = self.client.post("/api/batches/", payload, format="json")
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.assertEqual(Batch.objects.count(), 0)

    def test_capacity_upper_bound_is_accepted_and_has_clear_error(self):
        at_limit = self.client.post(
            "/api/batches/",
            {**self.payload, "max_students": 500},
            format="json",
        )
        self.assertEqual(at_limit.status_code, status.HTTP_201_CREATED)
        self.assertEqual(at_limit.data["max_students"], 500)

        over_limit = self.client.post(
            "/api/batches/",
            {
                **self.payload,
                "batch_code": "AI-2026-02",
                "max_students": 501,
            },
            format="json",
        )
        self.assertEqual(over_limit.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            over_limit.data["max_students"][0],
            "Capacity cannot exceed 500 students.",
        )

    def test_allowed_statuses_are_saved_and_returned_in_batch_list(self):
        create_statuses = (
            Batch.Status.PLANNED,
            Batch.Status.ONGOING,
        )
        for index, batch_status in enumerate(create_statuses, start=1):
            payload = {
                **self.payload,
                "batch_code": f"AI-2026-{index:02d}",
                "status": batch_status,
            }
            with self.subTest(status=batch_status):
                response = self.client.post("/api/batches/", payload, format="json")
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                self.assertEqual(response.data["status"], batch_status)
                self.assertEqual(
                    Batch.objects.get(pk=response.data["id"]).status,
                    batch_status,
                )

        list_response = self.client.get("/api/batches/")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        listed_statuses = {
            batch["batch_code"]: batch["status"]
            for batch in list_response.data["results"]
        }
        for index, batch_status in enumerate(create_statuses, start=1):
            self.assertEqual(listed_statuses[f"AI-2026-{index:02d}"], batch_status)

    def test_completed_and_cancelled_statuses_cannot_be_set_on_new_batches(self):
        for index, invalid_status in enumerate(
            (Batch.Status.COMPLETED, Batch.Status.CANCELLED),
            start=1,
        ):
            with self.subTest(status=invalid_status):
                response = self.client.post(
                    "/api/batches/",
                    {
                        **self.payload,
                        "batch_code": f"INVALID-{index}",
                        "status": invalid_status,
                    },
                    format="json",
                )
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertEqual(
                    response.data["status"][0],
                    "New batches must have Planned or Ongoing status.",
                )

        omitted_status = {key: value for key, value in self.payload.items() if key != "status"}
        response = self.client.post(
            "/api/batches/",
            omitted_status,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], Batch.Status.PLANNED)

    def test_approved_status_transitions_persist_after_refresh(self):
        allowed_transitions = (
            (Batch.Status.PLANNED, Batch.Status.ONGOING),
            (Batch.Status.PLANNED, Batch.Status.CANCELLED),
            (Batch.Status.ONGOING, Batch.Status.COMPLETED),
            (Batch.Status.ONGOING, Batch.Status.CANCELLED),
        )
        for index, (current_status, next_status) in enumerate(allowed_transitions, start=1):
            batch = Batch.objects.create(
                **{
                    **self.payload,
                    "batch_code": f"TRANSITION-{index:02d}",
                    "status": current_status,
                },
            )
            with self.subTest(current=current_status, next=next_status):
                response = self.client.patch(
                    f"/api/batches/{batch.pk}/",
                    {"status": next_status},
                    format="json",
                )
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(response.data["status"], next_status)

                refreshed = self.client.get(f"/api/batches/{batch.pk}/")
                self.assertEqual(refreshed.status_code, status.HTTP_200_OK)
                self.assertEqual(refreshed.data["status"], next_status)

                batch.refresh_from_db()
                self.assertEqual(batch.status, next_status)

    def test_invalid_and_terminal_status_transitions_are_rejected_by_api(self):
        invalid_transitions = (
            (Batch.Status.PLANNED, Batch.Status.COMPLETED),
            (Batch.Status.ONGOING, Batch.Status.PLANNED),
            (Batch.Status.COMPLETED, Batch.Status.PLANNED),
            (Batch.Status.COMPLETED, Batch.Status.ONGOING),
            (Batch.Status.COMPLETED, Batch.Status.CANCELLED),
            (Batch.Status.CANCELLED, Batch.Status.PLANNED),
            (Batch.Status.CANCELLED, Batch.Status.ONGOING),
            (Batch.Status.CANCELLED, Batch.Status.COMPLETED),
        )
        for index, (current_status, next_status) in enumerate(invalid_transitions, start=1):
            batch = Batch.objects.create(
                **{
                    **self.payload,
                    "batch_code": f"INVALID-TRANSITION-{index:02d}",
                    "status": current_status,
                },
            )
            with self.subTest(current=current_status, next=next_status):
                response = self.client.patch(
                    f"/api/batches/{batch.pk}/",
                    {"status": next_status},
                    format="json",
                )
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

                refreshed = self.client.get(f"/api/batches/{batch.pk}/")
                self.assertEqual(refreshed.data["status"], current_status)

    def test_database_constraints_reject_invalid_batch_data(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            Batch.objects.create(**{**self.payload, "max_students": 0})
        with self.assertRaises(IntegrityError), transaction.atomic():
            Batch.objects.create(**{**self.payload, "end_date": "2026-11-30"})


class BatchSessionAuthenticationTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username="session-staff",
            password="test-password",
            is_staff=True,
        )

    def test_existing_staff_session_can_access_batch_list(self):
        self.client.force_login(self.staff)
        response = self.client.get("/api/batches/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_session_authentication_requires_csrf_for_batch_writes(self):
        csrf_client = APIClient(enforce_csrf_checks=True)
        csrf_client.get("/admin/login/")
        csrf_client.force_login(self.staff)
        payload = {
            "name": "CSRF Protected Batch",
            "batch_code": "CSRF-2026",
            "start_date": "2026-12-01",
            "end_date": "2026-12-10",
            "max_students": 10,
            "status": Batch.Status.PLANNED,
        }

        missing_token = csrf_client.post("/api/batches/", payload, format="json")
        self.assertEqual(missing_token.status_code, status.HTTP_403_FORBIDDEN)

        csrf_token = csrf_client.cookies["csrftoken"].value
        accepted = csrf_client.post(
            "/api/batches/",
            payload,
            format="json",
            HTTP_X_CSRFTOKEN=csrf_client.cookies["csrftoken"].value,
        )
        self.assertEqual(accepted.status_code, status.HTTP_201_CREATED)
