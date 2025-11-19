import json
import os
import re
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from typing import List, Dict, Any, Optional

class RuleEngine:
    def __init__(self, rules_file="brain/rules.json"):
        self.rules = self.load_rules(rules_file)
        # State to track event counts: {rule_name: {source_ip: [timestamps]}}
        self.state = defaultdict(lambda: defaultdict(list))
        # Track unique IPs for anomaly detection
        self.ip_history = defaultdict(list)
        print(f"[+] Rule engine initialized with {len(self.rules)} rules")

    def load_rules(self, rules_file) -> List[Dict[str, Any]]:
        """Load rules from JSON file"""
        if not os.path.exists(rules_file):
            print(f"Warning: Rules file {rules_file} not found.")
            return []
        
        try:
            with open(rules_file, 'r') as f:
                rules = json.load(f)
            
            # Validate and enrich rules
            for rule in rules:
                # Set defaults
                rule.setdefault("enabled", True)
                rule.setdefault("threshold", 1)
                rule.setdefault("time_window", 60)
                rule.setdefault("priority", 5)
                
                # Compile regex patterns if they exist
                if rule.get("condition_type") == "regex" and "pattern" in rule:
                    try:
                        rule["compiled_pattern"] = re.compile(rule["pattern"], re.IGNORECASE)
                    except re.error as e:
                        print(f"[!] Invalid regex pattern in rule '{rule.get('rule_name')}': {e}")
                        rule["enabled"] = False
            
            return [r for r in rules if r.get("enabled", True)]
            
        except json.JSONDecodeError as e:
            print(f"[!] Error parsing rules file: {e}")
            return []

    def check_rules(self, log_entry: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check log entry against all rules"""
        alerts = []
        log_message = log_entry.get("message", "").lower()
        source_ip = log_entry.get("source_ip")
        timestamp = datetime.fromisoformat(log_entry.get("timestamp"))

        # Track IP for anomaly detection
        self.ip_history[source_ip].append(timestamp)

        for rule in self.rules:
            if not rule.get("enabled", True):
                continue
            
            # Check if condition matches
            if self._matches_condition(log_message, rule):
                # Check threshold
                if self.check_threshold(rule, source_ip, timestamp):
                    alert = {
                        "rule_name": rule["rule_name"],
                        "severity": rule["severity"],
                        "description": self._format_description(rule, source_ip, log_message),
                        "source_ip": source_ip,
                        "timestamp": timestamp,
                        "priority": rule.get("priority", 5)
                    }
                    alerts.append(alert)
                    print(f"[!] Alert triggered: {rule['rule_name']} (Priority: {alert['priority']})")
        
        # Sort alerts by priority (lower number = higher priority)
        alerts.sort(key=lambda x: x.get("priority", 5))
        
        return alerts

    def _matches_condition(self, log_message: str, rule: Dict[str, Any]) -> bool:
        """Check if log message matches rule condition"""
        condition_type = rule.get("condition_type", "substring")
        
        if condition_type == "substring":
            # Simple substring match
            condition = rule.get("condition", "").lower()
            return condition in log_message
        
        elif condition_type == "regex":
            # Regex pattern match
            if "compiled_pattern" in rule:
                return bool(rule["compiled_pattern"].search(log_message))
            return False
        
        elif condition_type == "exact":
            # Exact match
            return log_message == rule.get("condition", "").lower()
        
        return False

    def _format_description(self, rule: Dict[str, Any], source_ip: str, log_message: str) -> str:
        """Format alert description with context"""
        base_description = rule.get("description", f"Rule '{rule['rule_name']}' triggered")
        
        # Add source IP
        description = f"{base_description} from {source_ip}"
        
        # Add event count if threshold > 1
        threshold = rule.get("threshold", 1)
        if threshold > 1:
            description += f" ({threshold} events in {rule.get('time_window', 60)}s)"
        
        return description

    def check_threshold(self, rule: Dict[str, Any], source_ip: str, timestamp: datetime) -> bool:
        """Check if threshold is met for triggering alert"""
        rule_name = rule["rule_name"]
        threshold = rule.get("threshold", 1)
        time_window = rule.get("time_window", 60)  # seconds

        # Get event history for this rule and IP
        history = self.state[rule_name][source_ip]
        
        # Add current event
        history.append(timestamp)

        # Prune old events outside time window
        cutoff_time = timestamp - timedelta(seconds=time_window)
        history = [t for t in history if t > cutoff_time]
        self.state[rule_name][source_ip] = history

        # Check if threshold met
        if len(history) >= threshold:
            # Clear history to prevent duplicate alerts
            # But keep one event to maintain continuity
            self.state[rule_name][source_ip] = [timestamp]
            return True
        
        return False

    def detect_anomalies(self, source_ip: str, time_window_hours: int = 24) -> Optional[Dict[str, Any]]:
        """
        Detect statistical anomalies for an IP
        Returns anomaly info if detected, None otherwise
        """
        history = self.ip_history.get(source_ip, [])
        if len(history) < 10:  # Need minimum data for anomaly detection
            return None
        
        # Calculate event rate
        cutoff = datetime.now(timezone.utc) - timedelta(hours=time_window_hours)
        recent_events = [ts for ts in history if ts > cutoff]
        
        if len(recent_events) > 100:  # Anomaly threshold
            return {
                "type": "high_frequency",
                "event_count": len(recent_events),
                "time_window_hours": time_window_hours,
                "description": f"Anomalous activity: {len(recent_events)} events in {time_window_hours} hours"
            }
        
        return None

    def get_stats(self) -> Dict[str, Any]:
        """Get rule engine statistics"""
        return {
            "total_rules": len(self.rules),
            "enabled_rules": sum(1 for r in self.rules if r.get("enabled", True)),
            "tracked_ips": len(self.ip_history),
            "active_patterns": sum(len(ips) for ips in self.state.values())
        }

    def reload_rules(self, rules_file: Optional[str] = None):
        """Reload rules from file"""
        if rules_file:
            self.rules = self.load_rules(rules_file)
        print(f"[+] Rules reloaded: {len(self.rules)} active rules")

