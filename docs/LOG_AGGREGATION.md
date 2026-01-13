# Log Aggregation Setup Guide

This guide explains how to set up log aggregation for AppStandard applications.

## Overview

AppStandard uses structured JSON logging via the `@appstandard/server-core` logger. Logs are designed to be easily parsable by log aggregation systems.

## Log Format

All logs are structured JSON with consistent fields:

```json
{
  "timestamp": "2026-01-13T10:30:00.000Z",
  "level": "info",
  "message": "Request completed",
  "service": "appstandard-calendar",
  "correlationId": "abc-123-def",
  "duration": 45,
  "method": "POST",
  "path": "/trpc/event.create",
  "statusCode": 200
}
```

### Standard Fields

| Field | Description |
|-------|-------------|
| `timestamp` | ISO 8601 timestamp |
| `level` | Log level (debug, info, warn, error) |
| `message` | Human-readable message |
| `service` | Service name |
| `correlationId` | Request correlation ID for tracing |
| `error` | Error details (when applicable) |

### Security Events

Security-related logs include additional context:

```json
{
  "type": "security",
  "event": "rate_limit_exceeded",
  "ip": "192.168.1.1",
  "path": "/api/auth/sign-in",
  "reason": "auth rate limit exceeded"
}
```

## Option 1: ELK Stack (Elasticsearch, Logstash, Kibana)

### Docker Compose Setup

```yaml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    ports:
      - "5044:5044"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

volumes:
  elasticsearch-data:
```

### Logstash Pipeline Configuration

Create `logstash/pipeline/appstandard.conf`:

```ruby
input {
  # File input (for local development)
  file {
    path => "/var/log/appstandard/*.log"
    codec => json
    start_position => "beginning"
  }

  # TCP input (for Docker/container logs)
  tcp {
    port => 5044
    codec => json_lines
  }
}

filter {
  # Parse timestamp
  date {
    match => ["timestamp", "ISO8601"]
    target => "@timestamp"
  }

  # Add geo-ip for IP addresses (security events)
  if [ip] {
    geoip {
      source => "ip"
      target => "geoip"
    }
  }

  # Normalize log levels
  mutate {
    uppercase => ["level"]
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "appstandard-logs-%{+YYYY.MM.dd}"
  }
}
```

### Shipping Logs to Logstash

Configure your application to forward logs via TCP:

```typescript
// In your server startup
import net from 'net';

const logstashClient = net.createConnection({
  host: process.env.LOGSTASH_HOST || 'localhost',
  port: parseInt(process.env.LOGSTASH_PORT || '5044'),
});

// Pipe JSON logs to Logstash
process.stdout.on('data', (data) => {
  logstashClient.write(data);
});
```

## Option 2: Datadog

### Installation

```bash
# Install the Datadog agent
DD_API_KEY=<your-api-key> DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"
```

### Configuration

Add to your environment:

```env
DD_API_KEY=your-api-key
DD_LOGS_ENABLED=true
DD_APM_ENABLED=true
DD_SERVICE=appstandard-calendar
DD_ENV=production
```

### Log Collection Config

Create `/etc/datadog-agent/conf.d/appstandard.d/conf.yaml`:

```yaml
logs:
  - type: file
    path: /var/log/appstandard/*.log
    service: appstandard-calendar
    source: nodejs
    sourcecategory: serverless
```

## Option 3: CloudWatch (AWS)

### Using CloudWatch Agent

```json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/appstandard/*.log",
            "log_group_name": "appstandard-logs",
            "log_stream_name": "{instance_id}-{hostname}",
            "timestamp_format": "%Y-%m-%dT%H:%M:%S.%fZ"
          }
        ]
      }
    }
  }
}
```

### Direct Integration (for ECS/Lambda)

Logs written to stdout are automatically captured by CloudWatch when running on AWS ECS or Lambda.

## Option 4: Loki + Grafana

### Docker Compose Setup

```yaml
version: '3.8'

services:
  loki:
    image: grafana/loki:2.9.0
    ports:
      - "3100:3100"
    volumes:
      - loki-data:/loki

  promtail:
    image: grafana/promtail:2.9.0
    volumes:
      - /var/log:/var/log
      - ./promtail-config.yaml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml

  grafana:
    image: grafana/grafana:10.2.0
    ports:
      - "3000:3000"
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
    volumes:
      - grafana-data:/var/lib/grafana

volumes:
  loki-data:
  grafana-data:
```

### Promtail Configuration

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: appstandard
    static_configs:
      - targets:
          - localhost
        labels:
          job: appstandard
          __path__: /var/log/appstandard/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            service: service
            message: message
      - labels:
          level:
          service:
```

## Correlation IDs

AppStandard automatically generates correlation IDs for request tracing. Pass these between services:

```typescript
// Frontend: Send correlation ID with requests
const correlationId = crypto.randomUUID();
fetch('/api/endpoint', {
  headers: {
    'X-Correlation-ID': correlationId,
  },
});

// Backend: Logs automatically include correlation ID
logger.info('Processing request', { correlationId });
```

## Alerting

### Example Alert Rules (Prometheus AlertManager)

```yaml
groups:
  - name: appstandard
    rules:
      - alert: HighErrorRate
        expr: rate(http_errors_total[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected

      - alert: SlowResponses
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 95th percentile response time exceeds 2s
```

## Best Practices

1. **Use structured logging**: Always log JSON for easy parsing
2. **Include correlation IDs**: Enable request tracing across services
3. **Set appropriate retention**: 30 days for debug, 90 days for errors
4. **Index selectively**: Only index fields you'll query
5. **Monitor log volume**: Set up alerts for unusual log volumes
6. **Redact PII**: Never log passwords, tokens, or personal data

## Security Considerations

- Store logs in encrypted storage
- Restrict access to log aggregation systems
- Implement log retention policies (GDPR compliance)
- Redact sensitive data before shipping logs
- Use TLS for log transport
