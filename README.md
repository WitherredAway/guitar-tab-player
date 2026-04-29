# Guitar Tab Player

A web-based guitar tablature player built with Svelte 5 and Tone.js. Paste any ASCII guitar tab, and it plays it back with real sampled guitar sounds — complete with hammer-ons, pull-offs, slides, and more.

**Website: https://witherredaway.github.io/guitar-tabs-player/**

## Screenshots

| Paste your tab | Tab loaded & ready to play |
|---|---|
| ![Empty state](docs/screenshots/empty-state.png) | ![Tab loaded](docs/screenshots/tab-loaded.png) |

## Features

- **Paste & play** — paste raw guitar tab text and hear it played back instantly
- **Auto-detect tuning** — reads string labels (`e|`, `B|`, `G|`, `D|`, `A|`, `E|`, etc.) to automatically detect tuning
- **Tuning selector** — dropdown with auto-detected tuning, common presets (Standard, Drop D, DADGAD, Open G/D/E/A, Half Step Down), and a custom option with individual string note selectors
- **Acoustic & electric** — toggle between real guitar sample sets
- **Technique support** — plays hammer-ons (`h`), pull-offs (`p`), slides up (`/`) and down (`\`) with appropriate velocity and timing
- **Player controls** — play/pause, previous/next chord navigation, clickable progress bar with seeking
- **Speed control** — adjustable playback speed from 0.25x to 2.0x
- **Keyboard shortcuts** — Space (play/pause), Left/Right arrows (prev/next chord)
- **Tab display** — visual rendering of parsed tab with real-time playback highlighting and auto-scroll
- **Example tabs** — dropdown with two built-in example tabs to try immediately
- **Responsive design** — works on desktop and mobile

## Tab Format

Supports standard ASCII guitar tablature:

```
e|3----5h8-5h8p5\3-3p0---|
B|------2h4---2p0-2/4-2--|
G|-----------------------|
D|-----------------------|
A|-----------------------|
E|0--0-----0-----0-------|
```

**Supported techniques:**
- `h` — hammer-on (e.g., `5h8`)
- `p` — pull-off (e.g., `8p5`)
- `/` — slide up (e.g., `2/4`)
- `\` — slide down (e.g., `5\3`)
- `-` — sustain / rest
- `|` — measure separator

Multi-digit fret numbers (10, 12, etc.) are supported. Each block of 6 strings represents a sequential section of the song — blocks are played one after another, not simultaneously.

## Tech Stack

- **[Svelte 5](https://svelte.dev/)** — reactive UI framework with Runes (`$state`, `$derived`, `$effect`)
- **[Vite](https://vite.dev/)** — fast build tool with hot module replacement
- **[Tone.js](https://tonejs.github.io/)** — Web Audio API library with real guitar samplers

## Project Structure

```
src/
├── App.svelte                    # Main app controller & state management
├── main.js                       # Entry point
├── app.css                       # Global styles & CSS variables
├── lib/
│   ├── tabParser.js              # Tab text → structured timeline parser
│   └── audioEngine.js            # Tone.js audio engine (samplers, playback)
└── components/
    ├── TabInput.svelte           # Textarea + example tab dropdown
    ├── TuningSelector.svelte     # Tuning dropdown (auto-detect, presets, custom)
    ├── GuitarTypeSelector.svelte # Acoustic/Electric selector
    ├── PlayerControls.svelte     # Transport controls, speed slider, progress bar
    └── TabDisplay.svelte         # Visual tab rendering with highlighting
```

## How to Run

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm (comes with Node.js)

### Development

```bash
# Clone the repo
git clone https://github.com/WitherredAway/guitar-tabs-player.git
cd guitar-tabs-player

# Install dependencies
npm install

# Start the dev server (with hot reload)
npm run dev
```

The app will be available at `http://localhost:5173/guitar-tabs-player/`.

### Production Build

```bash
# Build for production
npm run build

# Preview the production build locally
npm run preview
```

### Deployment

The project includes a GitHub Actions workflow for automatic deployment to GitHub Pages. After merging to `main`:

1. Go to repo **Settings → Pages → Source**
2. Select **GitHub Actions**
3. The site will auto-deploy on every push to `main`
4. Live at: **https://witherredaway.github.io/guitar-tabs-player/**
