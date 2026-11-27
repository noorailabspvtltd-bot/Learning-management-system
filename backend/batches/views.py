from rest_framework import viewsets
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response
from rest_framework import status
from .models import Batch
from .serializers import BatchSerializer
from .permissions import IsStaffOrSuperuser


class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all().order_by("id")
    serializer_class = BatchSerializer
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsStaffOrSuperuser]

    def destroy(self, request, *args, **kwargs):
        batch = self.get_object()
        if batch.status == Batch.Status.ONGOING:
            return Response(
                {"detail": "Ongoing batches cannot be deleted. Cancel or complete the batch first."},
                status=status.HTTP_409_CONFLICT,
            )
        return super().destroy(request, *args, **kwargs)