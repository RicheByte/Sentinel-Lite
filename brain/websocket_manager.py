from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict, Any
import json
import asyncio
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.connection_metadata: Dict[WebSocket, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, client_id: str = None):
        """Accept and register a new WebSocket connection"""
        await websocket.accept()
        self.active_connections.append(websocket)
        self.connection_metadata[websocket] = {
            "client_id": client_id or f"client_{len(self.active_connections)}",
            "connected_at": datetime.utcnow().isoformat(),
            "messages_sent": 0
        }
        print(f"[+] WebSocket connected: {self.connection_metadata[websocket]['client_id']}")
        print(f"[*] Active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection"""
        if websocket in self.active_connections:
            client_id = self.connection_metadata.get(websocket, {}).get("client_id", "unknown")
            self.active_connections.remove(websocket)
            if websocket in self.connection_metadata:
                del self.connection_metadata[websocket]
            print(f"[-] WebSocket disconnected: {client_id}")
            print(f"[*] Active connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket):
        """Send a message to a specific client"""
        try:
            await websocket.send_json(message)
            if websocket in self.connection_metadata:
                self.connection_metadata[websocket]["messages_sent"] += 1
        except Exception as e:
            print(f"[-] Error sending message to client: {e}")
            self.disconnect(websocket)

    async def broadcast(self, message: Dict[str, Any], message_type: str = "update"):
        """Broadcast a message to all connected clients"""
        if not self.active_connections:
            return
        
        payload = {
            "type": message_type,
            "data": message,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Create list of connections to avoid modification during iteration
        connections = self.active_connections.copy()
        
        for connection in connections:
            try:
                await connection.send_json(payload)
                if connection in self.connection_metadata:
                    self.connection_metadata[connection]["messages_sent"] += 1
            except WebSocketDisconnect:
                self.disconnect(connection)
            except Exception as e:
                print(f"[-] Broadcast error: {e}")
                self.disconnect(connection)

    async def broadcast_log(self, log_data: Dict[str, Any]):
        """Broadcast a new log entry to all clients"""
        await self.broadcast(log_data, message_type="new_log")

    async def broadcast_alert(self, alert_data: Dict[str, Any]):
        """Broadcast a new alert to all clients"""
        await self.broadcast(alert_data, message_type="new_alert")

    async def broadcast_stats(self, stats_data: Dict[str, Any]):
        """Broadcast updated statistics to all clients"""
        await self.broadcast(stats_data, message_type="stats_update")

    def get_stats(self) -> Dict[str, Any]:
        """Get connection statistics"""
        return {
            "active_connections": len(self.active_connections),
            "total_messages_sent": sum(
                meta.get("messages_sent", 0) 
                for meta in self.connection_metadata.values()
            )
        }

# Global WebSocket manager
manager = ConnectionManager()
