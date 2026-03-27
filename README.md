# AI Fitness Trainer 🏋️

Real-time exercise form correction and rep counting using computer vision (MediaPipe Pose) with a React frontend and FastAPI backend.

## Features

- 🎯 **Real-time pose detection** — MediaPipe Pose runs in the browser for zero-latency skeleton tracking
- 🔢 **Automatic rep counting** — State machine tracks exercise phases (up/down) to count reps
- 📐 **Joint angle display** — Shows relevant angles (knee, elbow, etc.) with color-coded feedback
- ✅ **Form correction** — Real-time feedback like "Go lower", "Keep your back straight"
- 🔄 **Exercise switching** — Supports Squats, Pushups, and Bicep Curls
- 📊 **Performance summary** — Session stats including reps, accuracy %, and history

## Architecture

```
┌──────────────────────┐        WebSocket (JSON)         ┌─────────────────────┐
│     React Frontend    │ ◄──────────────────────────────► │   FastAPI Backend    │
│                       │                                  │                      │
│  • Webcam capture     │   Landmarks JSON (33 points)     │  • Angle calculation │
│  • MediaPipe Pose     │ ─────────────────────────────►   │  • Form rules        │
│  • Skeleton overlay   │                                  │  • Rep counting      │
│  • UI components      │   Feedback JSON                  │  • State machine     │
│                       │ ◄─────────────────────────────   │  • Performance stats │
└──────────────────────┘                                  └─────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Pose Detection | MediaPipe Tasks Vision (browser-side) |
| Backend | Python FastAPI |
| Communication | WebSockets |
| Exercise Logic | Python + NumPy |

## Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **pip** (Python package manager)
- A webcam
- Chrome or Edge browser (recommended for best MediaPipe performance)

## Setup & Run

### 1. Backend

```bash
# Navigate to backend
cd backend

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

### 2. Frontend

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The frontend will open at `http://localhost:5173`

### 3. Usage

1. Open the app in Chrome/Edge
2. Click **"Load Model & Start"** — this downloads the MediaPipe model (~5MB)
3. Select an exercise (Squats, Pushups, or Bicep Curls)
4. Position yourself so your full body is visible in the camera
5. Start exercising! The app will:
   - Draw a skeleton overlay on your body
   - Count your reps automatically
   - Show joint angles in real-time
   - Provide form correction feedback
6. Click **"Show Performance Summary"** to see your session stats

## Supported Exercises

### 🏋️ Squats
- **Tracked:** Knee angle (hip-knee-ankle), Back angle (shoulder-hip-knee)
- **Rep counting:** Down when knee angle < 100°, Up when > 160°
- **Form checks:** Depth, back straightness, left/right symmetry

### 💪 Pushups
- **Tracked:** Elbow angle (shoulder-elbow-wrist), Body alignment (shoulder-hip-ankle)
- **Rep counting:** Down when elbow angle < 90°, Up when > 160°
- **Form checks:** Depth, plank position, arm symmetry

### 🦾 Bicep Curls
- **Tracked:** Arm angle (shoulder-elbow-wrist), Shoulder stability
- **Rep counting:** Curled when angle < 50°, Extended when > 160°
- **Form checks:** Full contraction, full extension, body swinging

## Project Structure

```
ai-fitness-trainer/
├── backend/
│   ├── main.py                      # FastAPI server + WebSocket
│   ├── requirements.txt             # Python dependencies
│   ├── models/
│   │   └── schemas.py               # Pydantic data models
│   └── exercise_engine/
│       ├── angle_calculator.py      # Joint angle math
│       ├── base_exercise.py         # Abstract exercise class
│       ├── squat.py                 # Squat detector
│       ├── pushup.py                # Pushup detector
│       ├── bicep_curl.py            # Bicep curl detector
│       └── exercise_manager.py      # Exercise registry
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  # Main app component
│   │   ├── index.css                # Design system
│   │   ├── components/
│   │   │   ├── CameraFeed.jsx       # Webcam + skeleton overlay
│   │   │   ├── ExerciseSelector.jsx # Exercise picker
│   │   │   ├── RepCounter.jsx       # Rep count display
│   │   │   ├── FeedbackPanel.jsx    # Form feedback messages
│   │   │   ├── AngleDisplay.jsx     # Joint angle gauges
│   │   │   ├── PerformanceSummary.jsx # Session stats
│   │   │   └── Header.jsx          # App header
│   │   ├── hooks/
│   │   │   ├── useMediaPipe.js      # MediaPipe initialization
│   │   │   └── useWebSocket.js      # WebSocket management
│   │   └── utils/
│   │       ├── drawingUtils.js      # Canvas skeleton drawing
│   │       └── landmarkUtils.js     # Landmark formatting
│   └── ...
└── README.md
```

## Sample Test Cases

| # | Test | Expected Result |
|---|------|----------------|
| 1 | Perform 5 squats | Counter shows 5 |
| 2 | Half squat (don't go deep) | "Go lower" feedback appears |
| 3 | Switch from squats to pushups | Counter resets to 0, exercise changes |
| 4 | Bicep curl with body swing | "Don't swing your body" feedback |
| 5 | Good form squat | "Great depth! 💪" feedback |
| 6 | Check performance summary | Shows reps, form accuracy %, avg ROM |
| 7 | Reset counter | All stats reset to 0 |
| 8 | Disconnect backend | "Disconnected" status shown, auto-reconnect attempts |

## Adding New Exercises

To add a new exercise:

1. Create a new file in `backend/exercise_engine/` (e.g., `lunges.py`)
2. Extend `BaseExercise` class
3. Implement the abstract methods:
   - `_calculate_angles()` — which joints to track
   - `_get_primary_angle()` — main angle for rep counting
   - `_get_down_threshold()` / `_get_up_threshold()` — phase thresholds
   - `_check_form()` — form validation rules
   - `_format_angles()` — UI display format
4. Register in `exercise_manager.py` → `EXERCISE_REGISTRY`
5. Add metadata in `frontend/src/utils/landmarkUtils.js` → `EXERCISES`

## License

MIT
