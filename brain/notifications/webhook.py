"""
Webhook notification handler for Sentinel-Lite
Supports Slack, Discord, and generic webhooks
"""

import httpx
from typing import Dict, Any, Optional
import os
from . import NotificationHandler, logger


class WebhookNotificationHandler(NotificationHandler):
    """Webhook notification handler for Slack, Discord, and custom webhooks"""
    
    def __init__(
        self,
        webhook_url: str = None,
        webhook_type: str = "slack",  # slack, discord, generic
        enabled: bool = True
    ):
        super().__init__(enabled)
        
        self.webhook_url = webhook_url or os.getenv("WEBHOOK_URL")
        self.webhook_type = webhook_type.lower()
        
        if not self.webhook_url:
            logger.warning("[!] Webhook notifications not configured. Missing WEBHOOK_URL.")
            self.enabled = False
    
    async def send(self, alert: Dict[str, Any]) -> bool:
        """Send webhook notification for alert"""
        if not self.enabled:
            return False
        
        try:
            # Create payload based on webhook type
            if self.webhook_type == "slack":
                payload = self._create_slack_payload(alert)
            elif self.webhook_type == "discord":
                payload = self._create_discord_payload(alert)
            else:
                payload = self._create_generic_payload(alert)
            
            # Send webhook
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(self.webhook_url, json=payload)
                response.raise_for_status()
            
            logger.info(f"[+] Webhook alert sent ({self.webhook_type}): {alert.get('rule_name')}")
            return True
            
        except Exception as e:
            logger.error(f"[!] Failed to send webhook alert: {e}")
            return False
    
    def _create_slack_payload(self, alert: Dict[str, Any]) -> Dict[str, Any]:
        """Create Slack-compatible webhook payload"""
        severity = alert.get("severity", "unknown").lower()
        
        # Color coding by severity
        colors = {
            "critical": "#dc2626",
            "high": "#ea580c",
            "medium": "#ca8a04",
            "low": "#2563eb"
        }
        color = colors.get(severity, "#6b7280")
        
        # Emoji by severity
        emojis = {
            "critical": "🚨",
            "high": "⚠️",
            "medium": "⚡",
            "low": "ℹ️"
        }
        emoji = emojis.get(severity, "🔔")
        
        return {
            "text": f"{emoji} *Sentinel-Lite Security Alert*",
            "attachments": [{
                "color": color,
                "fields": [
                    {
                        "title": "Alert",
                        "value": alert.get("rule_name", "Unknown"),
                        "short": False
                    },
                    {
                        "title": "Severity",
                        "value": severity.upper(),
                        "short": True
                    },
                    {
                        "title": "Source IP",
                        "value": alert.get("source_ip", "Unknown"),
                        "short": True
                    },
                    {
                        "title": "Description",
                        "value": alert.get("description", "No description"),
                        "short": False
                    },
                    {
                        "title": "Timestamp",
                        "value": alert.get("timestamp", "Unknown"),
                        "short": False
                    }
                ],
                "footer": "Sentinel-Lite SIEM",
                "footer_icon": "https://img.shields.io/badge/Sentinel-Lite-blue",
                "ts": int(alert.get("timestamp_epoch", 0)) if "timestamp_epoch" in alert else 0
            }]
        }
    
    def _create_discord_payload(self, alert: Dict[str, Any]) -> Dict[str, Any]:
        """Create Discord-compatible webhook payload"""
        severity = alert.get("severity", "unknown").lower()
        
        # Color coding by severity (Discord uses decimal color values)
        colors = {
            "critical": 14423100,  # Red
            "high": 15366164,      # Orange
            "medium": 16767050,    # Yellow
            "low": 2463027         # Blue
        }
        color = colors.get(severity, 7037277)
        
        return {
            "embeds": [{
                "title": f"🚨 Security Alert: {alert.get('rule_name', 'Unknown')}",
                "description": alert.get("description", "No description"),
                "color": color,
                "fields": [
                    {
                        "name": "Severity",
                        "value": severity.upper(),
                        "inline": True
                    },
                    {
                        "name": "Source IP",
                        "value": alert.get("source_ip", "Unknown"),
                        "inline": True
                    },
                    {
                        "name": "Timestamp",
                        "value": alert.get("timestamp", "Unknown"),
                        "inline": False
                    }
                ],
                "footer": {
                    "text": "Sentinel-Lite SIEM"
                }
            }]
        }
    
    def _create_generic_payload(self, alert: Dict[str, Any]) -> Dict[str, Any]:
        """Create generic webhook payload"""
        return {
            "type": "security_alert",
            "alert": alert,
            "source": "sentinel-lite",
            "version": "2.0"
        }


# Example usage in environment variables:
# WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
# WEBHOOK_TYPE=slack  # or discord, or generic
