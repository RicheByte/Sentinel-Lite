"""
Notification system for Sentinel-Lite
Supports multiple notification channels: Email, Webhooks, SMS
"""

from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class NotificationHandler(ABC):
    """Base class for notification handlers"""
    
    def __init__(self, enabled: bool = True):
        self.enabled = enabled
    
    @abstractmethod
    async def send(self, alert: Dict[str, Any]) -> bool:
        """Send notification for an alert"""
        pass
    
    def should_notify(self, alert: Dict[str, Any]) -> bool:
        """Determine if this alert should trigger notification"""
        if not self.enabled:
            return False
        
        # Only notify for high and critical severity by default
        severity = alert.get("severity", "").lower()
        return severity in ["high", "critical"]


class NotificationManager:
    """Manages multiple notification channels"""
    
    def __init__(self):
        self.handlers: List[NotificationHandler] = []
        logger.info("[+] Notification manager initialized")
    
    def register_handler(self, handler: NotificationHandler):
        """Register a notification handler"""
        self.handlers.append(handler)
        logger.info(f"[+] Registered notification handler: {handler.__class__.__name__}")
    
    async def send_alert(self, alert: Dict[str, Any]) -> Dict[str, bool]:
        """Send alert through all applicable notification channels"""
        results = {}
        
        for handler in self.handlers:
            if handler.should_notify(alert):
                try:
                    success = await handler.send(alert)
                    results[handler.__class__.__name__] = success
                except Exception as e:
                    logger.error(f"[!] Notification failed ({handler.__class__.__name__}): {e}")
                    results[handler.__class__.__name__] = False
        
        return results


# Global notification manager instance
notification_manager = NotificationManager()
