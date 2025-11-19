from fastapi import FastAPI, HTTPException, Depends, Request, WebSocket, WebSocketDisconnect, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_, func
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from pydantic import BaseModel
import json

from database import SessionLocal, engine, init_db, Log, Alert, get_db
from rule_engine import RuleEngine
from cache import cache
from geoip import geoip
from websocket_manager import manager
from middleware import setup_middlewares, limiter, logger
from notifications import notification_manager
from notifications.email import EmailNotificationHandler
from notifications.webhook import WebhookNotificationHandler

# Initialize DB and Rule Engine
init_db()
rule_engine = RuleEngine(rules_file="brain/rules.json")

app = FastAPI(
    title="Sentinel-Lite Brain",
    description="High-Performance SIEM Backend API",
    version="2.0.0"
)

# Setup middlewares (logging, security, rate limiting)
setup_middlewares(app, enable_auth=False)  # Set to True to enable API key auth

# Initialize notification handlers (optional, configured via environment variables)
# Email notifications (configure SMTP_* environment variables to enable)
email_handler = EmailNotificationHandler()
notification_manager.register_handler(email_handler)

# Webhook notifications (configure WEBHOOK_URL to enable)
webhook_handler = WebhookNotificationHandler()
notification_manager.register_handler(webhook_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, be more specific
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class LogCreate(BaseModel):
    timestamp: str
    source_ip: str
    message: str
    log_type: Optional[str] = "generic"
    user_agent: Optional[str] = None

class LogOut(BaseModel):
    id: int
    timestamp: datetime
    source_ip: str
    message: str
    log_type: str
    country: Optional[str] = None
    country_code: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    user_agent: Optional[str] = None

    class Config:
        from_attributes = True

class AlertOut(BaseModel):
    id: int
    timestamp: datetime
    rule_name: str
    severity: str
    description: str
    source_ip: str
    acknowledged: bool
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AlertAcknowledge(BaseModel):
    acknowledged_by: str

class StatsOut(BaseModel):
    total_logs: int
    total_alerts: int
    unacknowledged_alerts: int
    logs_last_hour: int
    alerts_last_hour: int
    top_source_ips: List[dict]
    alerts_by_severity: dict

# Background task for processing logs
async def process_log_async(log_data: dict, db: Session):
    """Process log in background: enrich with GeoIP and check rules"""
    try:
        # Run correlation engine
        alerts = rule_engine.check_rules(log_data)
        
        for alert_data in alerts:
            new_alert = Alert(
                timestamp=alert_data["timestamp"],
                rule_name=alert_data["rule_name"],
                severity=alert_data["severity"],
                description=alert_data["description"],
                source_ip=alert_data["source_ip"]
            )
            db.add(new_alert)
            # Flush to generate ID before broadcasting
            db.flush()
            db.refresh(new_alert)
            
            logger.warning(f"ALERT: {alert_data['rule_name']} (ID: {new_alert.id}) from {alert_data['source_ip']}")
            
            # Broadcast alert to WebSocket clients (now with valid ID)
            alert_payload = {
                "id": new_alert.id,
                "timestamp": new_alert.timestamp.isoformat(),
                "rule_name": new_alert.rule_name,
                "severity": new_alert.severity,
                "description": new_alert.description,
                "source_ip": new_alert.source_ip,
                "acknowledged": False
            }
            await manager.broadcast_alert(alert_payload)
            
            # Send notifications via configured channels (email, webhook, etc.)
            await notification_manager.send_alert(alert_payload)
        
        db.commit()
        
        # Invalidate stats cache
        cache.delete("stats")
        
    except Exception as e:
        logger.error(f"Error processing log: {e}")
        db.rollback()

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "redis_enabled": cache.enabled,
        "geoip_enabled": geoip.enabled,
        "websocket_connections": len(manager.active_connections)
    }

# Metrics endpoint
@app.get("/metrics")
async def metrics():
    """Basic metrics for monitoring"""
    return {
        "websocket_stats": manager.get_stats(),
        "cache_enabled": cache.enabled,
        "geoip_enabled": geoip.enabled
    }

# WebSocket endpoint for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket connection for real-time log and alert streaming"""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and handle any client messages
            data = await websocket.receive_text()
            # Could handle client commands here (e.g., filtering)
            logger.info(f"WebSocket message received: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# Log ingestion endpoint
@app.post("/api/ingest")
@limiter.limit("100/minute")  # Rate limit: 100 requests per minute
async def ingest_log(
    request: Request,
    log_data: LogCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Ingest log entry with enrichment and correlation"""
    # Normalize timestamp
    try:
        ts = datetime.fromisoformat(log_data.timestamp)
    except ValueError:
        ts = datetime.now(timezone.utc)

    # Enrich with GeoIP
    geo_data = geoip.lookup(log_data.source_ip)
    
    # Create log entry
    new_log = Log(
        timestamp=ts,
        source_ip=log_data.source_ip,
        message=log_data.message,
        log_type=log_data.log_type,
        country=geo_data.get("country"),
        country_code=geo_data.get("country_code"),
        city=geo_data.get("city"),
        latitude=geo_data.get("latitude"),
        longitude=geo_data.get("longitude"),
        timezone=geo_data.get("timezone"),
        user_agent=log_data.user_agent
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    # Broadcast log to WebSocket clients
    await manager.broadcast_log({
        "id": new_log.id,
        "timestamp": new_log.timestamp.isoformat(),
        "source_ip": new_log.source_ip,
        "message": new_log.message,
        "country": new_log.country,
        "city": new_log.city
    })

    # Process rules in background
    background_tasks.add_task(process_log_async, log_data.dict(), db)

    return {"status": "received", "log_id": new_log.id}

# Get logs with filtering and pagination
@app.get("/api/logs", response_model=List[LogOut])
@limiter.limit("30/minute")
async def get_logs(
    request: Request,
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    source_ip: Optional[str] = None,
    country: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get logs with optional filtering"""
    query = db.query(Log)
    
    # Apply filters
    if source_ip:
        query = query.filter(Log.source_ip == source_ip)
    if country:
        query = query.filter(Log.country == country)
    if start_date:
        start_dt = datetime.fromisoformat(start_date)
        query = query.filter(Log.timestamp >= start_dt)
    if end_date:
        end_dt = datetime.fromisoformat(end_date)
        query = query.filter(Log.timestamp <= end_dt)
    
    return query.order_by(desc(Log.timestamp)).offset(offset).limit(limit).all()

# Get alerts with filtering
@app.get("/api/alerts", response_model=List[AlertOut])
@limiter.limit("30/minute")
async def get_alerts(
    request: Request,
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    severity: Optional[str] = None,
    acknowledged: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get alerts with optional filtering"""
    query = db.query(Alert)
    
    if severity:
        query = query.filter(Alert.severity == severity)
    if acknowledged is not None:
        query = query.filter(Alert.acknowledged == acknowledged)
    
    return query.order_by(desc(Alert.timestamp)).offset(offset).limit(limit).all()

# Acknowledge alert
@app.put("/api/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: int,
    ack_data: AlertAcknowledge,
    db: Session = Depends(get_db)
):
    """Acknowledge an alert"""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.acknowledged = True
    alert.acknowledged_by = ack_data.acknowledged_by
    alert.acknowledged_at = datetime.now(timezone.utc)
    db.commit()
    
    # Invalidate cache
    cache.delete("stats")
    
    logger.info(f"Alert {alert_id} acknowledged by {ack_data.acknowledged_by}")
    
    return {"status": "acknowledged", "alert_id": alert_id}

# Rule Management Models
class RuleCreate(BaseModel):
    rule_name: str
    condition_type: str = "substring"  # substring, regex, exact
    condition: str
    pattern: Optional[str] = None
    severity: str = "medium"
    threshold: int = 1
    time_window: int = 60
    enabled: bool = True
    priority: int = 5
    description: Optional[str] = None

class RuleUpdate(BaseModel):
    rule_name: Optional[str] = None
    condition_type: Optional[str] = None
    condition: Optional[str] = None
    pattern: Optional[str] = None
    severity: Optional[str] = None
    threshold: Optional[int] = None
    time_window: Optional[int] = None
    enabled: Optional[bool] = None
    priority: Optional[int] = None
    description: Optional[str] = None

# Rule Management Endpoints
@app.get("/api/rules")
async def get_rules():
    """Get all detection rules"""
    return rule_engine.get_rules()

@app.post("/api/rules")
async def create_rule(rule: RuleCreate):
    """Create a new detection rule"""
    rule_data = rule.dict(exclude_unset=True)
    new_rule = rule_engine.add_rule(rule_data)
    return new_rule

@app.put("/api/rules/{rule_id}")
async def update_rule(rule_id: int, rule: RuleUpdate):
    """Update an existing detection rule"""
    rule_data = rule.dict(exclude_unset=True)
    updated_rule = rule_engine.update_rule(rule_id, rule_data)
    
    if not updated_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    return updated_rule

@app.delete("/api/rules/{rule_id}")
async def delete_rule(rule_id: int):
    """Delete a detection rule"""
    success = rule_engine.delete_rule(rule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    return {"status": "deleted", "rule_id": rule_id}

# Get statistics
@app.get("/api/stats", response_model=StatsOut)
@limiter.limit("60/minute")
async def get_stats(request: Request, db: Session = Depends(get_db)):
    """Get system statistics with caching"""
    # Try cache first
    cached_stats = cache.get("stats")
    if cached_stats:
        return cached_stats
    
    # Calculate stats
    total_logs = db.query(Log).count()
    total_alerts = db.query(Alert).count()
    unacknowledged_alerts = db.query(Alert).filter(Alert.acknowledged == False).count()
    
    # Last hour stats
    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
    logs_last_hour = db.query(Log).filter(Log.timestamp >= one_hour_ago).count()
    alerts_last_hour = db.query(Alert).filter(Alert.timestamp >= one_hour_ago).count()
    
    # Top source IPs (last 24 hours)
    twenty_four_hours_ago = datetime.now(timezone.utc) - timedelta(hours=24)
    top_ips_data = db.query(
        Log.source_ip, 
        Log.country,
        func.count(Log.id).label('count')
    ).filter(
        Log.timestamp >= twenty_four_hours_ago
    ).group_by(
        Log.source_ip, Log.country
    ).order_by(
        desc('count')
    ).limit(10).all()
    
    top_source_ips = [
        {"ip": ip, "country": country or "Unknown", "count": count}
        for ip, country, count in top_ips_data
    ]
    
    # Alerts by severity
    severity_data = db.query(
        Alert.severity,
        func.count(Alert.id).label('count')
    ).group_by(Alert.severity).all()
    
    alerts_by_severity = {severity: count for severity, count in severity_data}
    
    stats = StatsOut(
        total_logs=total_logs,
        total_alerts=total_alerts,
        unacknowledged_alerts=unacknowledged_alerts,
        logs_last_hour=logs_last_hour,
        alerts_last_hour=alerts_last_hour,
        top_source_ips=top_source_ips,
        alerts_by_severity=alerts_by_severity
    )
    
    # Cache for 30 seconds
    cache.set("stats", stats.dict(), ttl=30)
    
    return stats

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
