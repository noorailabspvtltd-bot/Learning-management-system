from rest_framework.routers import DefaultRouter
from .views import PracticeCourseViewSet

router = DefaultRouter()
router.register(r"courses", PracticeCourseViewSet, basename="practice-course")

urlpatterns = router.urls