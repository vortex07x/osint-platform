import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from celery import Celery

celery_app = Celery(
    "osint_platform",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
    include=["tasks.scan_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)