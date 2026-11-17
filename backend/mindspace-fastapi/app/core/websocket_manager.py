from fastapi import WebSocket
from typing import Dict, List
import json
import logging

logger = logging.getLogger("mindspace.websocket")

class ConnectionManager:
    def __init__(self):
        # Maps conversation_id -> list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, conversation_id: str, websocket: WebSocket):
        await websocket.accept()
        if conversation_id not in self.active_connections:
            self.active_connections[conversation_id] = []
        self.active_connections[conversation_id].append(websocket)
        logger.info(f"WebSocket connected for conversation {conversation_id}. Total: {len(self.active_connections[conversation_id])}")

    def disconnect(self, conversation_id: str, websocket: WebSocket):
        if conversation_id in self.active_connections:
            if websocket in self.active_connections[conversation_id]:
                self.active_connections[conversation_id].remove(websocket)
            if not self.active_connections[conversation_id]:
                del self.active_connections[conversation_id]
        logger.info(f"WebSocket disconnected for conversation {conversation_id}.")

    async def broadcast(self, conversation_id: str, message: dict, exclude: WebSocket = None):
        if conversation_id in self.active_connections:
            disconnected = []
            for connection in list(self.active_connections[conversation_id]):
                if exclude is not None and connection == exclude:
                    continue
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.warning(f"Error sending to websocket in conversation {conversation_id}: {e}")
                    disconnected.append(connection)
            for dead in disconnected:
                self.disconnect(conversation_id, dead)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

manager = ConnectionManager()
