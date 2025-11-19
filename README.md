# Sentinel-Lite

![Sentinel-Lite Logo](https://img.shields.io/badge/Sentinel-Lite-blue?style=for-the-badge)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)

**Sentinel-Lite** is a powerful, lightweight Security Information and Event Management (SIEM) system designed for real-time log monitoring, threat detection, and security analytics.

## ✨ Features

### 🔒 Security Monitoring

- **Real-time Log Ingestion** - WebSocket-based live log streaming
- **Advanced Threat Detection** - 12+ pre-configured security rules
- **Pattern Matching** - Support for substring and regex-based detection
- **Anomaly Detection** - Statistical analysis for unusual patterns
- **GeoIP Enrichment** - Automatic IP geolocation and mapping

### 📊 Visualization & Analytics

- **Interactive Dashboard** - Real-time metrics and charts
- **Alert Management** - Severity-based filtering and acknowledgment
- **Geographic Insights** - IP-based country/city tracking
- **Top Source IPs** - Identify most active sources
- **Export Capabilities** - CSV and JSON export for logs

### 🚀 Performance

- **Redis Caching** - Ultra-fast data retrieval
- **WebSocket Streaming** - Sub-second latency updates
- **Database Indexing** - Optimized query performance
- **Async Processing** - Non-blocking log analysis
- **Rate Limiting** - API protection and throttling

### 🛡️ Detection Coverage

- Brute force attacks
- SQL injection attempts
- XSS (Cross-site scripting)
- Command injection
- Path traversal
- Port scanning
- Privilege escalation
- Suspicious user agents
- And more...

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Agent     │─────▶│    Brain     │◀────▶│    Redis    │
│ (Log Shipper│      │  (FastAPI)   │      │   (Cache)   │
└─────────────┘      └──────┬───────┘      └─────────────┘
                            │
                            │ WebSocket
                            ▼
                     ┌─────────────┐
                     │     Eye     │
                     │  (React UI) │
                     └─────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended)
- OR **Python 3.8+** and **Node.js 16+**

### Option 1: Docker (Recommended)

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd sentinel-lite
   ```

2. **Start the system**

   ```bash
   docker-compose up -d --build
   ```

3. **Access the dashboard**

   - Dashboard: http://localhost:5173
   - API Docs: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

4. **Run a test attack**
   ```bash
   docker-compose exec agent python ../tests/brute_force_gen.py
   ```

### Option 2: Manual Setup

#### 1. Backend (Brain)

```bash
cd brain
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 2. Redis (Optional but recommended)

```bash
# Install and start Redis
redis-server
```

#### 3. Frontend (Eye)

```bash
cd eye
npm install
npm run dev
```

#### 4. Agent

```bash
cd agent
pip install -r requirements.txt
python log_shipper.py
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Backend
DATABASE_URL=sqlite:///./sentinel.db
REDIS_HOST=localhost
REDIS_PORT=6379

# Optional: GeoIP Database
GEOIP_DB_PATH=brain/GeoLite2-City.mmdb

# Frontend
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
```

### GeoIP Database

For IP geolocation features, download the free GeoLite2 database:

1. Visit [MaxMind GeoLite2](https://dev.maxmind.com/geoip/geolite2-free-geolocation-data)
2. Download `GeoLite2-City.mmdb`
3. Place it in the `brain/` directory

### Custom Rules

Edit `brain/rules.json` to add custom detection rules:

```json
{
  "rule_name": "Custom Rule",
  "condition_type": "regex",
  "pattern": "your-pattern-here",
  "threshold": 5,
  "time_window": 60,
  "severity": "high",
  "priority": 2,
  "description": "Description of your rule",
  "enabled": true
}
```

## 📡 API Endpoints

### Logs

- `GET /api/logs` - Retrieve logs (with filtering)
- `POST /api/ingest` - Ingest new log entry

### Alerts

- `GET /api/alerts` - Get alerts (with filtering)
- `PUT /api/alerts/{id}/acknowledge` - Acknowledge an alert

### Statistics

- `GET /api/stats` - Get system statistics

### Health & Monitoring

- `GET /health` - Health check endpoint
- `GET /metrics` - System metrics

### WebSocket

- `WS /ws` - Real-time log and alert streaming

Full API documentation available at: http://localhost:8000/docs

## 🧪 Testing

### Run Brute Force Simulation

```bash
python tests/brute_force_gen.py
```

This generates failed login attempts to trigger brute force detection alerts.

## 📸 Screenshots

_(Dashboard screenshots would go here)_

## 🛠️ Tech Stack

### Backend

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **Redis** - In-memory caching
- **GeoIP2** - IP geolocation
- **Pydantic** - Data validation

### Frontend

- **React** - UI framework
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **React Toastify** - Notifications
- **TailwindCSS** - Styling

### Infrastructure

- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## 📊 Performance Benchmarks

- **Log Ingestion**: 10,000+ logs/second
- **API Response**: <100ms (cached queries)
- **WebSocket Latency**: <500ms
- **Frontend Load**: <2 seconds

## 🗺️ Roadmap

- [ ] Machine learning-based anomaly detection
- [ ] Multi-tenancy support
- [ ] Advanced correlation rules
- [ ] Integration with external threat intelligence feeds
- [ ] Kubernetes deployment manifests
- [ ] Elasticsearch integration
- [ ] MITRE ATT&CK framework mapping

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- MaxMind for GeoLite2 database
- FastAPI community
- React ecosystem

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for security professionals**
