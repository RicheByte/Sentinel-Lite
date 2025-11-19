# Sentinel-Lite API Documentation

## Base URL

```
http://localhost:8000
```

## Authentication

Authentication is **optional** and disabled by default. To enable API key authentication:

1. Set `API_KEY` environment variable
2. Include API key in requests:

```
X-API-Key: your-secret-api-key
```

## Rate Limiting

Most endpoints are rate-limited to prevent abuse:

- **Ingestion**: 100 requests/minute
- **Query endpoints**: 30-60 requests/minute

Rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## Endpoints

### Health & Monitoring

#### GET /health

Health check endpoint for monitoring.

**Response**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T12:00:00Z",
  "redis_enabled": true,
  "geoip_enabled": true,
  "websocket_connections": 5
}
```

#### GET /metrics

System metrics for monitoring.

**Response**

```json
{
  "websocket_stats": {
    "active_connections": 5,
    "total_messages_sent": 1523
  },
  "cache_enabled": true,
  "geoip_enabled": true
}
```

---

### Log Management

#### POST /api/ingest

Ingest a new log entry.

**Rate Limit**: 100/minute

**Request Body**

```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "source_ip": "192.168.1.100",
  "message": "User login failed",
  "log_type": "apache",
  "user_agent": "Mozilla/5.0 ..."
}
```

**Response**

```json
{
  "status": "received",
  "log_id": 12345
}
```

**Status Codes**

- `200`: Successfully ingested
- `422`: Validation error
- `429`: Rate limit exceeded
- `500`: Server error

#### GET /api/logs

Retrieve logs with optional filtering and pagination.

**Rate Limit**: 30/minute

**Query Parameters**

- `limit` (int, max 500): Number of logs to return (default: 100)
- `offset` (int): Offset for pagination (default: 0)
- `source_ip` (string): Filter by source IP
- `country` (string): Filter by country
- `start_date` (ISO 8601): Filter logs after this date
- `end_date` (ISO 8601): Filter logs before this date

**Example Request**

```
GET /api/logs?limit=50&source_ip=192.168.1.100&start_date=2024-01-15T00:00:00Z
```

**Response**

```json
[
  {
    "id": 12345,
    "timestamp": "2024-01-15T12:00:00Z",
    "source_ip": "192.168.1.100",
    "message": "User login failed",
    "log_type": "apache",
    "country": "United States",
    "country_code": "US",
    "city": "New York",
    "latitude": 40.7128,
    "longitude": -74.006,
    "user_agent": "Mozilla/5.0 ..."
  }
]
```

---

### Alert Management

#### GET /api/alerts

Retrieve alerts with optional filtering.

**Rate Limit**: 30/minute

**Query Parameters**

- `limit` (int, max 200): Number of alerts to return (default: 50)
- `offset` (int): Offset for pagination (default: 0)
- `severity` (string): Filter by severity (critical, high, medium, low)
- `acknowledged` (boolean): Filter by acknowledgment status

**Example Request**

```
GET /api/alerts?severity=critical&acknowledged=false&limit=20
```

**Response**

```json
[
  {
    "id": 789,
    "timestamp": "2024-01-15T12:05:00Z",
    "rule_name": "Brute Force Attack",
    "severity": "critical",
    "description": "Multiple failed login attempts detected from 192.168.1.100 (5 events in 60s)",
    "source_ip": "192.168.1.100",
    "acknowledged": false,
    "acknowledged_by": null,
    "acknowledged_at": null
  }
]
```

#### PUT /api/alerts/{alert_id}/acknowledge

Acknowledge an alert.

**Path Parameters**

- `alert_id` (int): Alert ID

**Request Body**

```json
{
  "acknowledged_by": "admin"
}
```

**Response**

```json
{
  "status": "acknowledged",
  "alert_id": 789
}
```

**Status Codes**

- `200`: Successfully acknowledged
- `404`: Alert not found
- `422`: Validation error

---

### Statistics

#### GET /api/stats

Get comprehensive system statistics.

**Rate Limit**: 60/minute

**Response**

```json
{
  "total_logs": 15234,
  "total_alerts": 456,
  "unacknowledged_alerts": 12,
  "logs_last_hour": 234,
  "alerts_last_hour": 5,
  "top_source_ips": [
    {
      "ip": "192.168.1.100",
      "country": "United States",
      "count": 523
    }
  ],
  "alerts_by_severity": {
    "critical": 45,
    "high": 123,
    "medium": 234,
    "low": 54
  }
}
```

---

### WebSocket

#### WS /ws

Real-time log and alert streaming.

**Connection**

```javascript
const ws = new WebSocket("ws://localhost:8000/ws");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};
```

**Message Types**

**New Log**

```json
{
  "type": "new_log",
  "timestamp": "2024-01-15T12:00:00Z",
  "data": {
    "id": 12345,
    "timestamp": "2024-01-15T12:00:00Z",
    "source_ip": "192.168.1.100",
    "message": "User login failed",
    "country": "United States",
    "city": "New York"
  }
}
```

**New Alert**

```json
{
  "type": "new_alert",
  "timestamp": "2024-01-15T12:05:00Z",
  "data": {
    "id": 789,
    "timestamp": "2024-01-15T12:05:00Z",
    "rule_name": "Brute Force Attack",
    "severity": "critical",
    "description": "Multiple failed login attempts detected",
    "source_ip": "192.168.1.100",
    "acknowledged": false
  }
}
```

**Stats Update**

```json
{
  "type": "stats_update",
  "timestamp": "2024-01-15T12:00:00Z",
  "data": {
    "total_logs": 15234,
    "total_alerts": 456,
    ...
  }
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "detail": "Invalid request parameters"
}
```

### 401 Unauthorized

```json
{
  "detail": "Invalid or missing API key"
}
```

### 404 Not Found

```json
{
  "detail": "Resource not found"
}
```

### 422 Validation Error

```json
{
  "detail": [
    {
      "loc": ["body", "source_ip"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### 429 Too Many Requests

```json
{
  "detail": "Rate limit exceeded"
}
```

### 500 Internal Server Error

```json
{
  "detail": "Internal server error"
}
```

---

## Interactive Documentation

FastAPI provides auto-generated interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

These interfaces allow you to:

- Browse all available endpoints
- View request/response schemas
- Test endpoints directly from the browser
- Download OpenAPI specification

---

## Code Examples

### Python

```python
import requests

# Ingest a log
response = requests.post(
    'http://localhost:8000/api/ingest',
    json={
        'timestamp': '2024-01-15T12:00:00Z',
        'source_ip': '192.168.1.100',
        'message': 'User login failed'
    }
)
print(response.json())

# Get alerts
response = requests.get(
    'http://localhost:8000/api/alerts',
    params={'severity': 'critical', 'limit': 10}
)
alerts = response.json()
```

### JavaScript

```javascript
// Fetch logs
fetch("http://localhost:8000/api/logs?limit=50")
  .then((response) => response.json())
  .then((logs) => console.log(logs));

// Acknowledge alert
fetch("http://localhost:8000/api/alerts/789/acknowledge", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ acknowledged_by: "admin" }),
})
  .then((response) => response.json())
  .then((data) => console.log(data));
```

### curl

```bash
# Ingest log
curl -X POST http://localhost:8000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2024-01-15T12:00:00Z",
    "source_ip": "192.168.1.100",
    "message": "User login failed"
  }'

# Get stats
curl http://localhost:8000/api/stats

# Acknowledge alert
curl -X PUT http://localhost:8000/api/alerts/789/acknowledge \
  -H "Content-Type: application/json" \
  -d '{"acknowledged_by": "admin"}'
```

---

## Best Practices

1. **Use WebSocket for real-time updates** instead of polling
2. **Implement pagination** for large result sets
3. **Cache responses** when appropriate
4. **Handle rate limits** gracefully with exponential backoff
5. **Validate input** before sending requests
6. **Use filters** to reduce unnecessary data transfer
7. **Monitor health endpoint** for service availability
