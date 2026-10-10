# The Tokyo Yokai Underground: Awakening

A small, playable browser prototype: 3D Tokyo street, Rintaro, Waguri, a supernatural gate, a Yokai encounter, dialogue, basic combat, and local save progress.

## Run it

**Recommended (computer):**
1. Extract the ZIP.
2. Install a recent version of Python 3 if needed.
3. Open a terminal in this folder.
4. Run `python -m http.server 8000`
5. Visit `http://localhost:8000` in your browser.

**Android:**
- Extract the ZIP using your file manager.
- Open the folder in a code editor with a local preview/server, or upload it to a static host such as GitHub Pages/Netlify.
- Visit the local server URL in Chrome. Opening `index.html` directly with `file://` may not work because the game uses JavaScript modules.

## Controls
- **W A S D** or arrow keys: move
- **Shift**: run
- **Drag the screen/mouse**: rotate camera
- **E**: interact / advance dialogue
- **Space**: spirit attack
- **Mobile:** on-screen movement, Talk, and Attack buttons; drag to rotate camera

## Story flow
1. Investigate the gate and speak with Waguri.
2. Approach the Yokai and use spirit attacks.
3. Return to Waguri after purifying the Yokai.
4. Finish the first mission and continue exploring.

Progress is stored in browser `localStorage`. Use **RESET STORY** in the mission-complete screen to restart.

## Notes / next steps
- The prototype uses Three.js from a CDN, so the first launch requires internet. The service worker caches the app shell and attempts to cache Three.js after it is fetched; full offline behavior depends on the browser successfully caching the library.
- Character models are simple procedural placeholders, not final production anime models.
- Online multiplayer is intentionally not included yet. A future version needs a backend, account/session design, authoritative combat state, and secure networking.
- For a production-quality 3D anime game, replace placeholder characters with rigged GLB/GLTF models, add animation clips, sound, quest scripting, accessibility options, and performance testing on target phones.
