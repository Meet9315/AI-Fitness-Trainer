"""
AI Fitness Trainer — FastAPI Backend
=====================================
Real-time exercise form correction and rep counting server.

Endpoints:
    - GET  /                  Health check
    - GET  /exercises         List available exercises
    - WS   /ws                WebSocket for real-time pose analysis

WebSocket Protocol:
    Client sends JSON:
        - {"type": "landmarks", "landmarks": [...], "timestamp": 0.0}
        - {"type": "set_exercise", "exercise": "squat"}
        - {"type": "reset"}
        - {"type": "get_summary"}

    Server responds JSON:
        - {"type": "feedback", "rep_count": 0, "phase": "idle", ...}
        - {"type": "summary", "current": {...}, "history": [...]}
        - {"type": "exercises", "exercises": [...]}
"""

import json
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from exercise_engine.exercise_manager import ExerciseManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="AI Fitness Trainer",
    description="Real-time exercise form correction and rep counting API",
    version="1.0.0",
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "AI Fitness Trainer"}


@app.get("/exercises")
async def list_exercises():
    """List all available exercises."""
    return {"exercises": ExerciseManager.get_available_exercises()}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time pose analysis.

    Each connection gets its own ExerciseManager instance,
    maintaining independent state per user session.
    """
    await websocket.accept()
    manager = ExerciseManager()
    logger.info("New WebSocket connection established")

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                msg_type = message.get("type", "")

                if msg_type == "landmarks":
                    # Process pose landmarks
                    landmarks = message.get("landmarks", [])
                    if landmarks and len(landmarks) >= 33:
                        result = manager.process(landmarks)
                        # Serialize feedback and angles
                        response = {
                            "type": "feedback",
                            "rep_count": result["rep_count"],
                            "phase": result["phase"],
                            "exercise": result["exercise"],
                            "form_score": result["form_score"],
                            "feedback": [
                                {"message": f.message, "level": f.level}
                                for f in result["feedback"]
                            ],
                            "angles": [
                                {
                                    "name": a.name,
                                    "value": a.value,
                                    "min_good": a.min_good,
                                    "max_good": a.max_good,
                                }
                                for a in result["angles"]
                            ],
                        }
                        await websocket.send_text(json.dumps(response))

                elif msg_type == "set_exercise":
                    # Switch exercise
                    exercise = message.get("exercise", "squat")
                    success = manager.set_exercise(exercise)
                    await websocket.send_text(json.dumps({
                        "type": "exercise_changed",
                        "exercise": exercise,
                        "success": success,
                    }))
                    logger.info(f"Exercise switched to: {exercise}")

                elif msg_type == "reset":
                    # Reset current exercise
                    manager.reset()
                    await websocket.send_text(json.dumps({
                        "type": "reset_done",
                    }))

                elif msg_type == "get_summary":
                    # Get performance summary
                    summary = manager.get_summary()
                    await websocket.send_text(json.dumps({
                        "type": "summary",
                        **summary,
                    }))

            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON",
                }))
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": str(e),
                }))

    except WebSocketDisconnect:
        logger.info("WebSocket connection closed")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
