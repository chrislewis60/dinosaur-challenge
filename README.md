# Rex Voltage — Underground Arcade

A browser-based 3D first-person experience built with React and Three.js. Step into a gritty neon-lit underground arcade as Rex Voltage, a dino champion fighting to reclaim his stolen legacy.

## Overview

The game opens with a comic-panel cutscene that sets the scene, then drops you into a fully explorable 3D arcade room rendered in the browser. Move around, soak in the atmosphere, and take a seat at the arcade cabinet.

## Tech Stack

| Package | Purpose |
|---|---|
| [React 19](https://react.dev) | UI and scene state management |
| [Three.js](https://threejs.org) | 3D rendering engine |
| [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) | React renderer for Three.js |
| [@react-three/drei](https://github.com/pmndrs/drei) | Three.js helpers (PointerLockControls, Sky, etc.) |
| [@react-three/rapier](https://github.com/pmndrs/react-three-rapier) | Physics engine |
| [Vite](https://vite.dev) | Dev server and bundler |

## Project Structure

```
src/
  App.jsx                    # Root — switches between cutscene and game
  components/
    Cutscene.jsx             # Comic-panel intro sequence
    Cutscene.css
    Game.jsx                 # 3D scene root (Canvas, lights, HUD)
    Game.css
    ArcadeRoom.jsx           # Room geometry, arcade cabinets, furniture
    FirstPersonControls.jsx  # WASD + mouse-look + sit/stand logic
    PlayerBody.jsx           # Physics body for the player
public/                      # Static assets (images used in cutscene)
```

## Setup

### Prerequisites

- [Node.js](https://nodejs.org) v18 or later
- npm (included with Node.js)

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Other scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot module replacement |
| `npm run build` | Build for production (output to `dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint |

## Controls

| Input | Action |
|---|---|
| **Click** | Lock mouse pointer / start game |
| **W A S D** | Move |
| **Mouse** | Look around |
| **Arrow Down** | Sit / stand (when near the chair) |
| **ESC** | Pause / unlock mouse |
