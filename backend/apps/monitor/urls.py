from django.urls import path
from .views import JobListView, TriggerJobView, JobStatusView, WebShellView, DBShellView, DBSchemaView, LogStreamView, LogCreateView

urlpatterns = [
    path('jobs/', JobListView.as_view(), name='jobs'),
    path('jobs/trigger/', TriggerJobView.as_view(), name='trigger_job'),
    path('jobs/<str:task_id>/', JobStatusView.as_view(), name='job_status'),
    path('shell/', WebShellView.as_view(), name='shell'),
    path('db/', DBShellView.as_view(), name='db'),
    path('db/schema/', DBSchemaView.as_view(), name='db_schema'),
    path('logs/', LogStreamView.as_view(), name='logs'),
    path('logs/create/', LogCreateView.as_view(), name='logs_create'),
]