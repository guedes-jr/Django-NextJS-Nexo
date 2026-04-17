"""
APIs para monitorar jobs, filas e WebShell
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_celery_results.models import TaskResult
from django.contrib.auth import get_user_model
from django.db import connection
import subprocess
import os
import shlex

User = get_user_model()
from .models import CommandHistory, QueryHistory, AppLog, FeatureFlag, ConfigHistory

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
            'run_portfolio_reconciliation': 'apps.portfolio.tasks.run_portfolio_reconciliation',
            'auto_resolve_issues': 'apps.portfolio.tasks.auto_resolve_issues',
            'cleanup_old_reconciliation_issues': 'apps.portfolio.tasks.cleanup_old_reconciliation_issues',
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


class WebShellView(APIView):
    permission_classes = (IsAuthenticated,)
    
    def get(self, request):
        if not request.user.is_admin:
            return Response({"error": "Acesso negado"}, status=403)
        
        history = [
            {
                "id": i,
                "command": cmd.command,
                "output": cmd.output[:500] if cmd.output else "",
                "exit_code": cmd.exit_code,
                "created_at": cmd.created_at.isoformat() if cmd.created_at else None,
            }
            for i, cmd in enumerate(
                CommandHistory.objects.all()[:50]
            )
        ]
        
        return Response({"history":history})
    
    def post(self, request):
        if not request.user.is_admin:
            return Response({"error": "Acesso negado"}, status=403)
        
        command = request.data.get('command', '').strip()
        if not command:
            return Response({"error": "Comando vazio"}, status=400)
        
        safe_commands = [
            'ls','pwd','cd','cat','echo','whoami','ps','top','df','free','date','uptime',
            'python','python3','pip','pip3','npm','node','git','curl','wget',
            'manage.py'
        ]
        
        output = ""
        exit_code = 0
        
        parts = shlex.split(command)
        if not parts:
            return Response({"error": "Comando inválido"}, status=400)
        
        base_cmd = parts[0]
        
        if base_cmd == 'clear':
            CommandHistory.objects.all().delete()
            return Response({"output": "Terminal limpo", "exit_code": 0})
        
        if base_cmd == 'help':
            return Response({
                "output": "Comandos disponíveis:\n" + "\n".join(safe_commands) + "\n\nUse 'manage.py <comando>' para Django\nUse 'ls' para listar arquivos\nUse 'clear' para limpar terminal",
                "exit_code": 0
            })
        
        if base_cmd == 'manage.py':
            manage_args = parts[1:] if len(parts) > 1 else ['--help']
            try:
                output = subprocess.run(
                    ['python3', 'manage.py'] + list(manage_args),
                    capture_output=True,
                    text=True,
                    timeout=60,
                    cwd=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'nexo_api')
                )
                output = output.stdout + output.stderr
                exit_code = 0 if output else 1
            except subprocess.TimeoutExpired:
                output = "Timeout: comando expirou"
                exit_code = 124
            except Exception as e:
                output = f"Erro: {str(e)}"
                exit_code = 1
        
        elif base_cmd in safe_commands:
            try:
                result = subprocess.run(
                    parts,
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                output = result.stdout + result.stderr
                exit_code = result.returncode
            except subprocess.TimeoutExpired:
                output = "Timeout: comando expirou"
                exit_code = 124
            except FileNotFoundError:
                output = f"Comando '{base_cmd}' não encontrado"
                exit_code = 127
            except Exception as e:
                output = f"Erro: {str(e)}"
                exit_code = 1
        else:
            output = f"Comando '{base_cmd}' não permitido. Use 'help' para ver comandos disponíveis."
            exit_code = 126
        
        return Response({
            "command": command,
            "output": output,
            "exit_code": exit_code
        })


class CommandHistory:
    pass


class DBShellView(APIView):
    permission_classes = (IsAuthenticated,)
    
    def get(self, request):
        if not request.user.is_admin:
            return Response({"error": "Acesso negado"}, status=403)
        
        history = [
            {
                "id": i,
                "query": q.query[:100],
                "rows_affected": q.rows_affected,
                "status": q.status,
                "execution_time": q.execution_time,
                "created_at": q.created_at.isoformat() if q.created_at else None,
            }
            for i, q in enumerate(QueryHistory.objects.all()[:50])
        ]
        
        return Response({"history": history})
    
    def post(self, request):
        if not request.user.is_admin:
            return Response({"error": "Acesso negado"}, status=403)
        
        query = request.data.get('query', '').strip()
        export = request.data.get('export', '')
        
        if not query:
            return Response({"error": "Query vazia"}, status=400)
        
        from django.db import connection
        import time
        import json
        
        forbidden = [
            'DROP DATABASE',
            'DROP SCHEMA',
            'TRUNCATE',
            'DELETE FROM auth_user', 
            'DELETE FROM django_session',
            'ALTER TABLE auth',
            'ALTER TABLE django',
        ]
        
        for f in forbidden:
            if f in query.upper():
                return Response({"error": f"Comando não permitido: {f}"}, status=403)
        
        start_time = time.time()
        output = []
        rows_affected = 0
        status = 'SUCCESS'
        error_message = ''
        
        try:
            with connection.cursor() as cursor:
                if query.upper().strip().startswith('SELECT') or 'RETURNING' in query.upper():
                    cursor.execute(query)
                    columns = [col[0] for col in cursor.description] if cursor.description else []
                    rows = cursor.fetchall()
                    rows_affected = len(rows)
                    
                    if export == 'json':
                        result = [dict(zip(columns, row)) for row in rows]
                        output = json.dumps(result, indent=2, default=str)[:10000]
                    elif export == 'csv':
                        import csv
                        import io
                        output = ','.join(columns) + '\n'
                        for row in rows:
                            output += ','.join([str(v) for v in row]) + '\n'
                    else:
                        for row in rows[:100]:
                            output.append([str(v) for v in row])
                else:
                    cursor.execute(query)
                    rows_affected = cursor.rowcount
                    output = [f"OK: {rows_affected} linha(s) afetada(s)"]
        except Exception as e:
            status = 'ERROR'
            error_message = str(e)
            output = [f"Erro: {error_message}"]
        
        execution_time = (time.time() - start_time) * 1000
        
        QueryHistory.objects.create(
            user=request.user,
            query=query,
            rows_affected=rows_affected,
            status=status,
            error_message=error_message,
            execution_time=execution_time
        )
        
        return Response({
            "query": query,
            "output": output,
            "columns": output[0] if output and isinstance(output[0], list) else [],
            "rows_affected": rows_affected,
            "status": status,
            "execution_time": round(execution_time, 2)
        })


class DBSchemaView(APIView):
    permission_classes = (IsAuthenticated,)
    
    def get(self, request):
        if not request.user.is_admin:
            return Response({"error": "Acesso negado"}, status=403)
        
        from django.db import connection
        
        schema = []
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT table_name, column_name, data_type, is_nullable
                    FROM information_schema.columns 
                    WHERE table_schema = 'public'
                    ORDER BY table_name, ordinal_position
                """)
                for row in cursor.fetchall():
                    schema.append({
                        "table": row[0],
                        "column": row[1],
                        "type": row[2],
                        "nullable": row[3]
                    })
        except:
            pass
        
        return Response({"schema": schema})


class LogStreamView(APIView):
    permission_classes = (IsAuthenticated,)
    
    def get(self, request):
        if not request.user.is_admin:
            return Response({"error": "Acesso negado"}, status=403)
        
        level = request.query_params.get('level')
        logger = request.query_params.get('logger')
        search = request.query_params.get('search')
        limit = int(request.query_params.get('limit', 100))
        
        logs = AppLog.objects.all()
        
        if level:
            logs = logs.filter(level=level.upper())
        if logger:
            logs = logs.filter(logger__icontains=logger)
        if search:
            logs = logs.filter(message__icontains=search)
        
        logs = logs[:limit]
        
        return Response({
            "logs": [
                {
                    "id": log.id,
                    "logger": log.logger,
                    "level": log.level,
                    "message": log.message,
                    "traceback": log.traceback[:500] if log.traceback else None,
                    "extra_data": log.extra_data,
                    "ip_address": log.ip_address,
                    "user": log.user.username if log.user else None,
                    "created_at": log.created_at.isoformat(),
                }
                for log in logs
            ]
        })


class LogCreateView(APIView):
    permission_classes = (IsAuthenticated,)
    
    def post(self, request):
        logger = request.data.get('logger', 'app')
        level = request.data.get('level', 'INFO').upper()
        message = request.data.get('message', '')
        traceback = request.data.get('traceback', '')
        extra_data = request.data.get('extra_data', {})
        
        valid_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        if level not in valid_levels:
            level = 'INFO'
        
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        ip = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')
        
        AppLog.objects.create(
            logger=logger,
            level=level,
            message=message,
            traceback=traceback,
            extra_data=extra_data,
            ip_address=ip,
            user=request.user if request.user.is_authenticated else None,
        )
        
        return Response({"status": "ok"})


class CacheManagerView(APIView):
    permission_classes = (IsAuthenticated,)
    
    def get(self, request):
        if not request.user.is_admin:
            return Response({"error": "Acesso negado"}, status=403)
        
        from django.core.cache import cache
        
        cache_keys = []
        try:
            for key in cache._cache.keys('*'):
                if key:
                    try:
                        value = cache.get(key)
                        ttl = cache.ttl(key) if hasattr(cache, 'ttl') else -1
                        cache_keys.append({
                            "key": key,
                            "type": type(value).__name__,
                            "ttl": ttl,
                        })
                    except:
                        pass
        except:
            try:
                keys = cache.keys('*')
                for key in keys[:100]:
                    cache_keys.append({
                        "key": key,
                        "type": "unknown",
                        "ttl": -1,
                    })
            except:
                pass
        
        return Response({"cache_keys": cache_keys[:100]})
    
    def post(self, request):
        if not request.user.is_admin:
            return Response({"error": "Acesso negado"}, status=403)
        
        action = request.data.get('action')
        key = request.data.get('key')
        ttl = request.data.get('ttl')
        
        from django.core.cache import cache
        
        if action == 'delete' and key:
            cache.delete(key)
            return Response({"status": "deleted", "key": key})
        
        if action == 'clear':
            cache.clear()
            return Response({"status": "cleared"})
        
        if action == 'set_ttl' and key and ttl:
            cache.set(key, cache.get(key), timeout=int(ttl))
            return Response({"status": "updated", "key": key, "ttl": ttl})
        
        return Response({"error": "Ação inválida"}, status=400)


class ConfigEditorView(APIView):
    permission_classes = (IsAuthenticated,)
    
    def get(self, request):
        if not request.user.is_admin:
            return Response({"error": "Acesso negado"}, status=403)
        
        flags = FeatureFlag.objects.all()
        return Response({
            "flags": [
                {
                    "id": f.id,
                    "name": f.name,
                    "description": f.description,
                    "value": f.value,
                    "is_active": f.is_active,
                    "is_global": f.is_global,
                    "created_at": f.created_at.isoformat() if f.created_at else None,
                    "updated_at": f.updated_at.isoformat() if f.updated_at else None,
                }
                for f in flags
            ]
        })
    
    def post(self, request):
        if not request.user.is_admin:
            return Response({"error": "Acesso negado"}, status=403)
        
        action = request.data.get('action')
        
        if action == 'create':
            name = request.data.get('name')
            value = request.data.get('value', {})
            description = request.data.get('description', '')
            
            if not name:
                return Response({"error": "Nome é obrigatório"}, status=400)
            
            flag, created = FeatureFlag.objects.get_or_create(
                name=name,
                defaults={
                    'value': value,
                    'description': description,
                    'created_by': request.user
                }
            )
            
            return Response({
                "message": "Flag criada" if created else "Flag já existe",
                "id": flag.id
            })
        
        if action == 'update':
            flag_id = request.data.get('id')
            value = request.data.get('value')
            is_active = request.data.get('is_active')
            change_reason = request.data.get('change_reason', '')
            
            try:
                flag = FeatureFlag.objects.get(id=flag_id)
            except FeatureFlag.DoesNotExist:
                return Response({"error": "Flag não encontrada"}, status=404)
            
            ConfigHistory.objects.create(
                config=flag,
                old_value=flag.value,
                new_value=value,
                changed_by=request.user,
                change_reason=change_reason
            )
            
            if value is not None:
                flag.value = value
            if is_active is not None:
                flag.is_active = is_active
            
            flag.save()
            
            return Response({"message": "Flag atualizada"})
        
        if action == 'delete':
            flag_id = request.data.get('id')
            
            try:
                flag = FeatureFlag.objects.get(id=flag_id)
                flag.delete()
                return Response({"message": "Flag deletada"})
            except FeatureFlag.DoesNotExist:
                return Response({"error": "Flag não encontrada"}, status=404)
        
        return Response({"error": "Ação inválida"}, status=400)


class ConfigHistoryView(APIView):
    permission_classes = (IsAuthenticated,)
    
    def get(self, request, flag_id):
        if not request.user.is_admin:
            return Response({"error": "Acesso negado"}, status=403)
        
        history = ConfigHistory.objects.filter(config_id=flag_id)[:20]
        
        return Response({
            "history": [
                {
                    "old_value": h.old_value,
                    "new_value": h.new_value,
                    "changed_by": h.changed_by.username if h.changed_by else None,
                    "change_reason": h.change_reason,
                    "created_at": h.created_at.isoformat(),
                }
                for h in history
            ]
        })