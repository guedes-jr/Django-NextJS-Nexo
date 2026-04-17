from django.urls import path
from .views import JobListView, TriggerJobView, JobStatusView, WebShellView

urlpatterns = [
    path('jobs/', JobListView.as_view(), name='jobs'),
    path('jobs/trigger/', TriggerJobView.as_view(), name='trigger_job'),
    path('jobs/<str:task_id>/', JobStatusView.as_view(), name='job_status'),
    path('shell/', WebShellView.as_view(), name='shell'),
]