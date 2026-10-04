# FM Signals Virtual Laboratory — Cinematic Always-Opening Edition

A single FM Signals & Systems virtual experiment with an integrated FM walkie-talkie application.

## Opening behavior
- The cinematic FM landing screen appears on **every fresh page load/reload**.
- No `localStorage` visited flag is used for the opening screen.
- Click **ENTER VIRTUAL LAB** to enter the main laboratory.
- Opening the **Walkie-Talkie Simulator** always shows its separate cinematic radio intro first.
- Click **START RADIO SIMULATION** to enter the actual walkie-talkie controls.

## Main modules
Theory → Mathematical Model → Procedure → FM Simulation → FFT → Channel/Noise → Walkie-Talkie → Observations → Result → Viva → References.

## Features
- Dark/light theme
- Full-screen website mode
- Full-screen graph buttons
- Explicit graph axis labels and numerical tick values
- Animated FM/radio graphics
- Local walkie-talkie SVG (works without internet)
- PTT TX/RX animation
- Audio/demo signal input
- FM modulation/demodulation simulation
- Noise and attenuation controls

Open `index.html` with VS Code + Live Server for the best presentation experience.

Fullscreen scrolling was explicitly fixed: the main site no longer applies a fixed-position panel to the HTML root, so the entire page remains vertically scrollable in browser fullscreen.


## Creative upgrade
This edition adds a live FM control room, automatic engineering insight, carrier/sideband markers on the spectrum, an animated transmitter-to-receiver story, presentation mode, and viva question randomization. The walkie-talkie transmission animation is educational and does not transmit real RF.
