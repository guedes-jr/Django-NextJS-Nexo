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
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._shell_namespace = {
            '__name__': '__console__',
            '__doc__': None,
        }
        self._initialized = False
    
    def _init_django(self):
        if not self._initialized:
            import django
            from django.conf import settings
            if not settings.configured:
                import os
                import sys
                sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'nexo_api'))
                os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nexo_api.settings')
                django.setup()
            from django.apps import apps
            from django.conf import settings
            self._shell_namespace['apps'] = apps
            self._shell_namespace['settings'] = settings
            from django.contrib.auth import get_user_model
            User = get_user_model()
            self._shell_namespace['User'] = User
            self._shell_namespace['User'] = User
            from apps.portfolio.models import InvestmentAccount, Asset, Position, Transaction
            self._shell_namespace['InvestmentAccount'] = InvestmentAccount
            self._shell_namespace['Asset'] = Asset
            self._shell_namespace['Position'] = Position
            self._shell_namespace['Transaction'] = Transaction
            try:
                from apps.intelligence.models import StockScore, Watchlist, Projecao
                self._shell_namespace['StockScore'] = StockScore
                self._shell_namespace['Watchlist'] = Watchlist
                self._shell_namespace['Projecao'] = Projecao
            except:
                pass
            try:
                from apps.market_data.models import AtivoB3
                self._shell_namespace['AtivoB3'] = AtivoB3
            except:
                pass
            self._initialized = True
    
    def _get_attributes(self, obj):
        attrs = []
        try:
            for attr in dir(obj):
                if not attr.startswith('_'):
                    try:
                        val = getattr(obj, attr)
                        if callable(val):
                            attrs.append({'name': attr, 'type': 'method'})
                        elif hasattr(val, '__iter__') and not isinstance(val, str):
                            attrs.append({'name': attr, 'type': 'property'})
                        else:
                            attrs.append({'name': attr, 'type': 'property'})
                    except:
                        attrs.append({'name': attr, 'type': 'property'})
        except:
            pass
        return attrs[:50]
    
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
            return Response({"error": "Acesso negativo"}, status=403)
        
        command = request.data.get('command', '').strip()
        if not command:
            return Response({"error": "Comando vazio"}, status=400)
        
        self._init_django()
        
        import sys
        from io import StringIO
        
        if command == 'clear':
            CommandHistory.objects.all().delete()
            return Response({"output": "Terminal limpo", "exit_code": 0})
        
        if command == 'help':
            return Response({
                "output": """WebShell Python (Django shell)
Modelos disponíveis:
  - User (usuarios)
  - InvestmentAccount, Asset, Position, Transaction (portfolio)
  - StockScore, Watchlist, Projecao (intelligence)
  - AtivoB3 (market_data)
  - apps, settings

Comandos especiais:
  - clear: limpar histórico
  - whoami: mostrar usuário atual
  -exit: sair do shell (mantém contexto)
Exemplos:
  User.objects.all()[:5]
  InvestmentAccount.objects.first()
  Asset.objects.filter(ticker__startswith='PETR')
  Transaction.objects.filter(account__id=1).order_by('-date')[:10]
  help(User)
""",
                "exit_code": 0
            })
        
        if command == 'whoami':
            return Response({
                "output": f"{request.user.username} (id={request.user.id}, admin={request.user.is_admin})",
                "exit_code": 0
            })
        
        old_stdout = sys.stdout
        sys.stdout = captured = StringIO()
        
        local_namespace = self._shell_namespace.copy()
        
        exit_code = 0
        output = ""
        error_msg = ""
        
        try:
            compiled = compile(command, '<string>', 'exec')
            exec(compiled, local_namespace)
            self._shell_namespace.update(local_namespace)
            output = captured.getvalue()
        except SyntaxError as e:
            error_msg = f"SyntaxError: {e.msg} (linha {e.lineno})"
            exit_code = 1
        except NameError as e:
            error_msg = f"NameError: {e}"
            exit_code = 1
        except TypeError as e:
            error_msg = f"TypeError: {e}"
            exit_code = 1
        except ImportError as e:
            error_msg = f"ImportError: {e}"
            exit_code = 1
        except Exception as e:
            error_msg = f"{type(e).__name__}: {e}"
            exit_code = 1
        finally:
            sys.stdout = old_stdout
        
        if not output and error_msg:
            output = error_msg
        
        return Response({
            "command": command,
            "output": output,
            "exit_code": exit_code
        })
    
    def get_attributes(self, request):
        if not request.user.is_admin:
            return Response({"error": "Acesso negado"}, status=403)
        
        target = request.query_params.get('target', '')
        
        if not target:
            return Response({"attributes": []})
        
        self._init_django()
        
        try:
            obj = self._shell_namespace.get(target)
            if obj is None:
                parts = target.split('.')
                obj = self._shell_namespace
                for p in parts:
                    obj = getattr(obj, p)
            
            attrs = self._get_attributes(obj)
            return Response({"target": target, "attributes": attrs})
        except Exception as e:
            return Response({"error": str(e)}, status=400)


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


class ShellAttributesView(APIView):
    permission_classes = (IsAuthenticated,)
    
    _shell_cache = {}
    
    def get(self, request):
        if not request.user.is_admin:
            return Response({"error": "Acesso negado"}, status=403)
        
        target = request.query_params.get('target', '')
        namespace = request.query_params.get('namespace', '')
        
        if not target:
            return Response({"attributes": []})
        
        try:
            import django
            from django.conf import settings
            if not settings.configured:
                import os
                import sys
                sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'nexo_api'))
                os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nexo_api.settings')
                django.setup()
            
            import sys
            from io import StringIO
            old_stdout = sys.stdout
            sys.stdout = StringIO()
            
            exec(f"from {namespace or 'django.contrib.auth import get_user_model' if target == 'User' else 'apps.portfolio.models import ' + target if target in ['InvestmentAccount', 'Asset', 'Position', 'Transaction'] else target}", {})
            
            result = sys.stdout.getvalue()
            sys.stdout = old_stdout
            
            obj = eval(target, {})
            attrs = []
            for attr in dir(obj):
                if not attr.startswith('_'):
                    try:
                        val = getattr(obj, attr)
                        if callable(val) and not attr.startswith('__'):
                            attrs.append({'name': attr, 'type': 'method', 'signature': str(type(val).__name__)})
                        elif hasattr(val, '__iter__') and not isinstance(val, (str, bytes)):
                            attrs.append({'name': attr, 'type': 'property', 'signature': f'[{type(val).__name__}]'})
                        else:
                            attrs.append({'name': attr, 'type': 'field', 'signature': type(val).__name__})
                    except:
                        attrs.append({'name': attr, 'type': 'unknown'})
            
            return Response({
                "target": target,
                "attributes": attrs[:50]
            })
        except Exception as e:
            return Response({"error": str(e), "attributes": []}, status=400)