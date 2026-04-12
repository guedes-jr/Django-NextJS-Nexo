"""
API para monitorar jobs e filas
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_celery_results.models import TaskResult
from django.contrib.auth import get_user_model

User = get_user_model()

class JobListView(APIView):
    permission_classes = (IsAuthenticated,)
    
    def get(self, request):
        if not request.user.is_admin:
            return Response({"error": "Acesso negado"}, status=403)
        
        # Get recent tasks
        tasks = TaskResult.objects.all()[:20]
        
        return Response({
            "tasks": [
                {
                    "id": t.task_id,
                    "name": t.task_name,
                    "status": t.status,
                    "result": t.result,
                    "date_done": t.date_done.isoformat() if t.date_done else None,
                    "runtime": t.runtime,
                }
                for t in tasks
            ]
        })


class TriggerJobView(APIView):
    permission_classes = (IsAuthenticated,)
    
    def post(self, request):
        if not request.user.is_admin:
            return Response({"error": "Acesso negado"}, status=403)
        
        job_name = request.data.get('job')
        
        jobs = {
            'update_b3_prices': 'apps.market_data.tasks.update_b3_prices',
            'update_b3_indices': 'apps.market_data.tasks.update_b3_indices',
            'update_all_market_data': 'apps.market_data.tasks.update_all_market_data',
        }
        
        if job_name not in jobs:
            return Response({"error": "Job não encontrado"}, status=404)
        
        from celery import shared_task
        task_path = jobs[job_name]
        
        # Get the task and run it
        from importlib import import_module
        module_path, task_name = task_path.rsplit('.', 1)
        module = import_module(module_path)
        task_func = getattr(module, task_name)
        
        result = task_func.delay()
        
        return Response({
            "message": f"Job {job_name} iniciado",
            "task_id": result.id,
            "status": "PENDING"
        })


class JobStatusView(APIView):
    permission_classes = (IsAuthenticated,)
    
    def get(self, request, task_id):
        if not request.user.is_admin:
            return Response({"error": "Acesso negado"}, status=403)
        
        try:
            task = TaskResult.objects.get(task_id=task_id)
            return Response({
                "id": task.task_id,
                "name": task.task_name,
                "status": task.status,
                "result": task.result,
                "date_done": task.date_done.isoformat() if task.date_done else None,
                "runtime": task.runtime,
            })
        except TaskResult.DoesNotExist:
            return Response({"error": "Task não encontrada"}, status=404)