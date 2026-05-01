<div align="center">

# Guitar Tab Player

### Paste. Play. Practice.

A web-based guitar tablature player that brings ASCII tabs to life with real sampled guitar sounds.

[![Svelte](https://img.shields.io/badge/Svelte_5-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)](https://svelte.dev/)
[![Tone.js](https://img.shields.io/badge/Tone.js-000000?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+PHBhdGggZD0iTTEyIDNWMTMuNTVBNCA0IDAgMSAwIDE0IDEzVjdINDBWM0gxMloiLz48L3N2Zz4=&logoColor=white)](https://tonejs.github.io/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222222?style=for-the-badge&logo=githubpages&logoColor=white)](https://witherredaway.github.io/guitar-tab-player/)

[![Visit the Website](https://img.shields.io/badge/Visit_the_Website-d4bbff?style=for-the-badge&logo=googlechrome&logoColor=0a0a0a)](https://witherredaway.github.io/guitar-tab-player/)

</div>

---

## Screenshots

<div align="center">

| Paste your tab | Tab loaded & ready to play |
|---|---|
| ![Empty state](docs/screenshots/empty-state.png) | ![Tab loaded](docs/screenshots/tab-loaded.png) |

</div>

---

## Features

| Feature | Description |
|---|---|
| **Paste & play** | Paste raw guitar tab text and hear it played back instantly |
| **Auto-detect tuning** | Reads string labels (`e\|`, `B\|`, `G\|`, etc.) to automatically detect tuning |
| **Tuning selector** | Auto-detected, presets (Standard, Drop D, DADGAD, Open G/D/E/A), and custom |
| **Acoustic & electric** | Toggle between real guitar sample sets |
| **Technique support** | Hammer-ons, pull-offs, slides up & down with proper velocity and timing |
| **Player controls** | Play/pause, prev/next chord, clickable progress bar with seeking |
| **Speed control** | Adjustable playback speed from 0.25x to 2.0x |
| **Keyboard shortcuts** | Space (play/pause), arrow keys (prev/next chord) |
| **Tab display** | Real-time playback highlighting with auto-scroll |
| **Example tabs** | Dropdown with two built-in example tabs to try immediately |
| **Responsive** | Works on desktop and mobile |

---

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

| Symbol | Technique | Example |
|--------|-----------|---------|
| `h` | Hammer-on | `5h8` |
| `p` | Pull-off | `8p5` |
| `/` | Slide up | `2/4` |
| `\` | Slide down | `5\3` |
| `-` | Sustain / rest | `---` |
| `\|` | Measure separator | `\|` |

> Multi-digit fret numbers (10, 12, etc.) are supported. Each block of 6 strings is a sequential section — blocks are played one after another, not simultaneously.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| [**Svelte 5**](https://svelte.dev/) | Reactive UI framework with Runes (`$state`, `$derived`, `$effect`) |
| [**Vite**](https://vite.dev/) | Fast build tool with hot module replacement |
| [**Tone.js**](https://tonejs.github.io/) | Web Audio API library with real guitar samplers |

---

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

---

## How to Run

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm (comes with Node.js)

### Development

```bash
# Clone the repo
git clone https://github.com/WitherredAway/guitar-tab-player.git
cd guitar-tab-player

# Install dependencies
npm install

# Start the dev server (with hot reload)
npm run dev
```

The app will be available at `http://localhost:5173/guitar-tab-player/`.

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
