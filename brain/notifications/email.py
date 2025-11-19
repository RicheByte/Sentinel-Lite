"""
Email notification handler for Sentinel-Lite
Sends email alerts for high/critical security events
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
import os
from . import NotificationHandler, logger


class EmailNotificationHandler(NotificationHandler):
    """Email notification handler using SMTP"""
    
    def __init__(
        self,
        smtp_server: str = None,
        smtp_port: int = 587,
        smtp_username: str = None,
        smtp_password: str = None,
        from_email: str = None,
        to_emails: list = None,
        enabled: bool = True
    ):
        super().__init__(enabled)
        
        # Load from environment variables if not provided
        self.smtp_server = smtp_server or os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = smtp_port or int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = smtp_username or os.getenv("SMTP_USERNAME")
        self.smtp_password = smtp_password or os.getenv("SMTP_PASSWORD")
        self.from_email = from_email or os.getenv("SMTP_FROM_EMAIL", self.smtp_username)
        self.to_emails = to_emails or os.getenv("ALERT_EMAIL_RECIPIENTS", "").split(",")
        
        # Validate configuration
        if not all([self.smtp_server, self.smtp_username, self.smtp_password, self.to_emails]):
            logger.warning("[!] Email notifications not configured. Missing SMTP settings.")
            self.enabled = False
    
    async def send(self, alert: Dict[str, Any]) -> bool:
        """Send email notification for alert"""
        if not self.enabled:
            return False
        
        try:
            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"🚨 Sentinel-Lite Alert: {alert.get('rule_name', 'Security Alert')}"
            msg["From"] = self.from_email
            msg["To"] = ", ".join(self.to_emails)
            
            # Create HTML email body
            html_body = self._create_html_body(alert)
            text_body = self._create_text_body(alert)
            
            msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"[+] Email alert sent: {alert.get('rule_name')} to {len(self.to_emails)} recipients")
            return True
            
        except Exception as e:
            logger.error(f"[!] Failed to send email alert: {e}")
            return False
    
    def _create_text_body(self, alert: Dict[str, Any]) -> str:
        """Create plain text email body"""
        severity = alert.get("severity", "unknown").upper()
        return f"""
SENTINEL-LITE SECURITY ALERT

Severity: {severity}
Alert: {alert.get('rule_name', 'Unknown')}
Time: {alert.get('timestamp', 'Unknown')}
Source IP: {alert.get('source_ip', 'Unknown')}

Description:
{alert.get('description', 'No description available')}

---
This is an automated alert from Sentinel-Lite SIEM.
Please investigate and acknowledge this alert in the dashboard.
"""
    
    def _create_html_body(self, alert: Dict[str, Any]) -> str:
        """Create HTML email body"""
        severity = alert.get("severity", "unknown").lower()
        
        # Color coding by severity
        colors = {
            "critical": "#dc2626",
            "high": "#ea580c",
            "medium": "#ca8a04",
            "low": "#2563eb"
        }
        color = colors.get(severity, "#6b7280")
        
        return f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .header {{ background-color: {color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
        .content {{ padding: 20px; }}
        .field {{ margin-bottom: 15px; }}
        .field-label {{ font-weight: bold; color: #374151; }}
        .field-value {{ color: #6b7280; margin-top: 5px; }}
        .footer {{ background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">🚨 Security Alert</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">{alert.get('rule_name', 'Security Alert')}</p>
        </div>
        <div class="content">
            <div class="field">
                <div class="field-label">Severity</div>
                <div class="field-value" style="color: {color}; font-weight: bold; text-transform: uppercase;">{severity}</div>
            </div>
            <div class="field">
                <div class="field-label">Timestamp</div>
                <div class="field-value">{alert.get('timestamp', 'Unknown')}</div>
            </div>
            <div class="field">
                <div class="field-label">Source IP</div>
                <div class="field-value">{alert.get('source_ip', 'Unknown')}</div>
            </div>
            <div class="field">
                <div class="field-label">Description</div>
                <div class="field-value">{alert.get('description', 'No description available')}</div>
            </div>
        </div>
        <div class="footer">
            <p>This is an automated alert from <strong>Sentinel-Lite SIEM</strong></p>
            <p>Please investigate and acknowledge this alert in your dashboard.</p>
        </div>
    </div>
</body>
</html>
"""


# Example usage in environment variables:
# SMTP_SERVER=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USERNAME=your-email@gmail.com
# SMTP_PASSWORD=your-app-password
# SMTP_FROM_EMAIL=sentinel@yourdomain.com
# ALERT_EMAIL_RECIPIENTS=security@yourdomain.com,admin@yourdomain.com
