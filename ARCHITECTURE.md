# Sentinel-Lite Architecture

## System Overview

Sentinel-Lite is a modern SIEM (Security Information and Event Management) system built with a microservices architecture for scalability and maintainability.

## Component Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         Sentinel-Lite                          │
└────────────────────────────────────────────────────────────────┘

┌─────────────┐           ┌──────────────────────────────────┐
│   Agent     │           │           Brain (API)            │
│  Container  │           │                                  │
│             │           │  ┌──────────────────────────┐   │
│ ┌─────────┐ │           │  │     FastAPI Server       │   │
│ │  Log    │ │  HTTP     │  │  - REST API Endpoints    │   │
│ │ Shipper ├─┼──────────▶│  │  - WebSocket Handler     │   │
│ │         │ │  POST     │  │  - Rate Limiting         │   │
│ └────┬────┘ │  /ingest  │  │  - Authentication        │   │
│      │      │           │  └──────────┬───────────────┘   │
│      │      │           │             │                   │
│  ┌───▼────┐ │           │  ┌──────────▼───────────────┐   │
│  │  File  │ │           │  │   Rule Engine            │   │
│  │ Watcher│ │           │  │  - Pattern Matching      │   │
│  └────────┘ │           │  │  - Regex Support         │   │
└─────────────┘           │  │  - Anomaly Detection     │   │
                          │  │  - Threshold Management  │   │
                          │  └──────────┬───────────────┘   │
                          │             │                   │
                          │  ┌──────────▼───────────────┐   │
                          │  │   Database Layer         │   │
                          │  │  - SQLAlchemy ORM        │   │
                          │  │  - SQLite                │   │
                          │  │  - Indexed Queries       │   │
                          │  └──────────┬───────────────┘   │
                          │             │                   │
                          │  ┌──────────▼───────────────┐   │
                          │  │   GeoIP Enrichment       │   │
                          │  │  - MaxMind GeoLite2      │   │
                          │  │  - IP Location Lookup    │   │
                          │  └──────────┬───────────────┘   │
                          └─────────────┼───────────────────┘
                                        │
                          ┌─────────────▼───────────────┐
                          │      Redis Cache            │
                          │  - Query Result Caching     │
                          │  - Stats Caching (30s TTL)  │
                          │  - GeoIP Caching (24h TTL)  │
                          └─────────────────────────────┘

                                   WebSocket
                                   │
                         ┌─────────▼──────────┐
                         │    Eye (Frontend)  │
                         │                    │
                         │  ┌──────────────┐  │
                         │  │   React App  │  │
                         │  └──────┬───────┘  │
                         │         │          │
                         │  ┌──────▼───────┐  │
                         │  │ Components:  │  │
                         │  │ - LogStream  │  │
                         │  │ - AlertPanel │  │
                         │  │ - StatsChart │  │
                         │  └──────────────┘  │
                         └────────────────────┘
```

## Data Flow

### Log Ingestion Flow

```
1. Log File Change
   └─▶ Agent File Watcher detects change
       └─▶ Parse log entry
           └─▶ HTTP POST to /api/ingest
               └─▶ Brain receives log
                   ├─▶ Enrich with GeoIP data
                   ├─▶ Save to database
                   ├─▶ Broadcast via WebSocket
                   └─▶ Background: Run rule engine
                       └─▶ If alert triggered:
                           ├─▶ Save alert to database
                           └─▶ Broadcast alert via WebSocket
```

### Real-time Update Flow

```
1. New Log/Alert Created
   └─▶ WebSocket Manager
       └─▶ Broadcast to all connected clients
           └─▶ Frontend receives message
               └─▶ Update state
                   └─▶ Re-render components
```

## Technology Stack

### Backend (Brain)

- **Framework**: FastAPI 0.104+
- **Database**: SQLAlchemy + SQLite
- **Cache**: Redis 7
- **GeoIP**: MaxMind GeoIP2
- **Rate Limiting**: SlowAPI
- **WebSocket**: FastAPI WebSocket support

### Frontend (Eye)

- **Framework**: React 19
- **State Management**: React Hooks (useState, useEffect)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: React Toastify
- **Styling**: TailwindCSS

### Agent

- **Language**: Python 3.8+
- **File Watching**: Watchdog
- **HTTP Client**: Requests

### Infrastructure

- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Networking**: Bridge Network

## Database Schema

### Logs Table

```sql
CREATE TABLE logs (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME INDEXED,
    source_ip VARCHAR INDEXED,
    message TEXT,
    log_type VARCHAR,
    country VARCHAR,
    country_code VARCHAR,
    city VARCHAR,
    latitude FLOAT,
    longitude FLOAT,
    timezone VARCHAR,
    user_agent VARCHAR,
    parsed_data TEXT,
    INDEX idx_timestamp_ip (timestamp, source_ip),
    INDEX idx_country_timestamp (country, timestamp)
);
```

### Alerts Table

```sql
CREATE TABLE alerts (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME INDEXED,
    rule_name VARCHAR INDEXED,
    severity VARCHAR INDEXED,
    description TEXT,
    source_ip VARCHAR INDEXED,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by VARCHAR,
    acknowledged_at DATETIME,
    correlation_id VARCHAR,
    false_positive BOOLEAN DEFAULT FALSE,
    INDEX idx_severity_timestamp (severity, timestamp),
    INDEX idx_acknowledged_severity (acknowledged, severity)
);
```

## Security Design

### API Security

- **Rate Limiting**: 100 requests/minute per endpoint
- **CORS**: Configurable allowed origins
- **Optional Authentication**: API key-based authentication
- **Input Validation**: Pydantic models for request validation

### Data Security

- **No PII Storage**: Logs stored temporarily, no permanent PII
- **Secure Connections**: Support for HTTPS/WSS in production
- **Database**: SQLite with file permissions

## Performance Optimizations

### Caching Strategy

- **Stats**: 30-second TTL
- **GeoIP**: 24-hour TTL for positive results, 1-hour for negative
- **Cache Warming**: Frequently accessed data pre-loaded

### Database Optimization

- **Indexes**: Composite indexes on frequently queried columns
- **Connection Pooling**: Reuse database connections
- **Async Queries**: Non-blocking database operations

### WebSocket Optimization

- **Efficient Broadcasting**: Batch updates to reduce message frequency
- **Connection Management**: Auto-reconnect with exponential backoff
- **Message Throttling**: Rate limit for high-frequency events

## Scalability Considerations

### Current Architecture

- Single-node deployment
- Suitable for small to medium deployments (< 10,000 logs/day)

### Future Scalability

- **Horizontal Scaling**: Multiple Brain instances behind load balancer
- **Database**: Migration to PostgreSQL for production
- **Cache**: Redis Cluster for distributed caching
- **Message Queue**: Add RabbitMQ/Kafka for high-volume log ingestion
- **Microservices**: Split rule engine into separate service

## Monitoring & Observability

### Health Checks

- `/health` endpoint for service status
- Redis connectivity check
- GeoIP database availability check
- WebSocket connection count

### Metrics

- Total logs ingested
- Total alerts generated
- WebSocket connections
- Cache hit rates
- Rule engine statistics

## Deployment Architectures

### Development

```
Docker Compose
├── Brain (API)
├── Eye (Frontend)
├── Agent (Log Shipper)
└── Redis (Cache)
```

### Production (Future)

```
Kubernetes Cluster
├── Ingress Controller (Nginx)
├── Brain Deployment (3 replicas)
├── Eye Deployment (2 replicas)
├── Agent DaemonSet
├── Redis StatefulSet
└── PostgreSQL StatefulSet
```

## Design Decisions

### Why SQLite?

- Simple deployment
- No external database server required
- Sufficient for MVP and small deployments
- Easy migration path to PostgreSQL

### Why Redis?

- Ultra-fast in-memory caching
- Reduces database load significantly
- Optional dependency (system works without it)

### Why WebSocket?

- Real-time bidirectional communication
- Lower latency than polling
- Reduced server load
- Better user experience

### Why FastAPI?

- Modern Python framework
- Built-in async support
- Auto-generated API documentation
- Type safety with Pydantic
- WebSocket support

## Future Enhancements

1. **Machine Learning**: Anomaly detection using sklearn
2. **Threat Intelligence**: Integration with external feeds
3. **Advanced Correlation**: Multi-stage attack detection
4. **User Management**: Multi-user with RBAC
5. **Compliance**: GDPR, SOC 2 compliance features
6. **Integrations**: SIEM/SOAR platform integrations
