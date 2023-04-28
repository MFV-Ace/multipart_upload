from rest_framework.routers import DefaultRouter

from document.views import DocumentUploadView, DocumentView

router = DefaultRouter(trailing_slash=False)

router.register('', DocumentView)
router.register('upload', DocumentUploadView, basename='document_upload')

urlpatterns = router.urls
