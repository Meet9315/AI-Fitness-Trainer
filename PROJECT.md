# AI Fitness Trainer - Project Vision
## Goal
Real-time exercise form correction and rep counting using computer vision (MediaPipe Pose) with a React frontend and FastAPI backend.

## Core Features
- Real-time pose detection using MediaPipe directly in browser
- Automatic rep counting using a state machine
- Form correction feedback based on joint angles
- Performance statistics

## Architecture
- Frontend: React + Vite + MediaPipe Tasks Vision
- Backend: FastAPI + WebSockets + Python & NumPy
- Communication: WebSockets transmitting JSON data
