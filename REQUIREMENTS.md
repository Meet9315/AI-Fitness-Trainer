# Requirements List (v1)

## Functional Requirements
- **Webcam Access**: App must connect to the user's webcam.
- **Pose Detection**: MediaPipe must detect 33 skeletal landmarks.
- **WebSocket Streaming**: Frontend must stream landmarks to backend efficiently.
- **Exercise Logic Engine**: Backend must process landmarks, compute joint angles, and classify state (up/down).
- **Rep Counting**: System must track full repetitions and handle transitions properly.
- **Form Feedback**: UI must display text indicating corrective measures (e.g., "Go Lower").
- **Exercises Support**: Squats, Pushups, Bicep Curls.
- **Performance Summary**: Session stats available at the end.

## Technical Requirements
- Python >= 3.10
- Node.js >= 18
- Modern browser (Chrome/Edge recommended)
- Realtime latency < 100ms
