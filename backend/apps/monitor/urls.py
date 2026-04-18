from django.urls import path
from .views import JobListView, TriggerJobView, JobStatusView, WebShellView, DBShellView, DBSchemaView, LogStreamView, LogCreateView, CacheManagerView, ConfigEditorView, ConfigHistoryView, ShellAttributesView

urlpatterns = [
    path('jobs/', JobListView.as_view(), name='jobs'),
    path('jobs/trigger/', TriggerJobView.as_view(), name='trigger_job'),
    path('jobs/<str:task_id>/', JobStatusView.as_view(), name='job_status'),
    path('shell/', WebShellView.as_view(), name='shell'),
    path('shell/attrs/', ShellAttributesView.as_view(), name='shell_attrs'),
    path('db/', DBShellView.as_view(), name='db'),
    path('db/schema/', DBSchemaView.as_view(), name='db_schema'),
    path('logs/', LogStreamView.as_view(), name='logs'),
    path('logs/create/', LogCreateView.as_view(), name='logs_create'),
    path('cache/', CacheManagerView.as_view(), name='cache'),
    path('config/', ConfigEditorView.as_view(), name='config'),
    path('config/<int:flag_id>/history/', ConfigHistoryView.as_view(), name='config_history'),
]