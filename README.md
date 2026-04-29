# Guitar Tab Player

A web app that plays guitar tablature. Paste any tab, and it plays it back with real guitar samples.

## Features

- **Paste & play** — paste raw guitar tab text and hear it played back
- **Auto-detect tuning** — reads string labels (`e|`, `C|`, `G|`, etc.) to detect tuning
- **Tuning selector** — dropdown with auto-detected tuning, common presets (Standard, Drop D, DADGAD, Open G/D/E/A), and custom option
- **Acoustic & electric** — switch between guitar sounds
- **Technique support** — hammer-ons (`h`), pull-offs (`p`), slides up (`/`) and down (`\`)
- **Player controls** — play/pause, prev/next chord, clickable progress bar
- **Speed control** — 0.25x to 2.0x playback speed
- **Keyboard shortcuts** — Space (play/pause), Arrow keys (prev/next)
- **Tab display** — visual rendering with playback position highlighting
- **Responsive** — works on desktop and mobile

## Tech Stack

- **[Svelte 5](https://svelte.dev/)** — UI framework
- **[Vite](https://vite.dev/)** — build tool
- **[Tone.js](https://tonejs.github.io/)** — audio engine with guitar samples

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── App.svelte                 # Main app (state management, playback logic)
├── main.js                    # Entry point
├── app.css                    # Global styles & CSS variables
├── lib/
│   ├── tabParser.js           # Tab text parser (tuning, frets, techniques)
│   └── audioEngine.js         # Tone.js audio engine (samplers, playback)
└── components/
    ├── TabInput.svelte        # Textarea for pasting tabs
    ├── TuningSelector.svelte  # Tuning dropdown
    ├── GuitarTypeSelector.svelte  # Acoustic/Electric dropdown
    ├── PlayerControls.svelte  # Transport controls & speed slider
    └── TabDisplay.svelte      # Visual tab rendering with highlighting
```

## Tab Format

Supports standard ASCII guitar tablature:

```
e|3----5h8-5h8p5\3-3p0---|
C|------2h4---2p0-2/4-2--|
G|-----------------------|
C|-----------------------|
G|-----------------------|
C|0--0-----0-----0-------|
```

**Techniques:**
- `h` — hammer-on (e.g., `5h8`)
- `p` — pull-off (e.g., `8p5`)
- `/` — slide up (e.g., `2/4`)
- `\` — slide down (e.g., `5\3`)
- `-` — sustain / rest
- `|` — measure separator
