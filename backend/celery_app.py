import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from celery import Celery
from celery.schedules import crontab

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

celery_app.conf.beat_schedule = {
    "check-monitored-scans-every-minute": {
        "task": "check_monitored_scans",
        "schedule": 60.0,  # runs every 60 seconds (for testing; change to e.g. 3600.0 for hourly in production)
    },
}