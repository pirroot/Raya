from django.urls import path
from .views import (
    MyCertificatesView,
    GenerateCertificateView,
    VerifyCertificateView,
    CertificateDetailView,
)

app_name = "certificates"

urlpatterns = [
    path("certificates/my/", MyCertificatesView.as_view(), name="my-certificates"),
    path(
        "certificates/generate/<uuid:course_id>/",
        GenerateCertificateView.as_view(),
        name="generate-certificate",
    ),
    path(
        "certificates/verify/<str:code>/",
        VerifyCertificateView.as_view(),
        name="verify-certificate",
    ),
    path(
        "certificates/<uuid:id>/",
        CertificateDetailView.as_view(),
        name="certificate-detail",
    ),
]
