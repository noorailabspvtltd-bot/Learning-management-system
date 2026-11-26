from rest_framework.routers import DefaultRouter
from .views import BatchViewSet

router = DefaultRouter()
router.register(r'batches', BatchViewSet)

urlpatterns = router.urls