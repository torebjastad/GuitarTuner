# CLAUDE.md — Guitar Tuner

## Project Overview

A lightweight, browser-based guitar tuner with no build step or external dependencies. It captures microphone audio via the Web Audio API and performs real-time pitch detection using one of two selectable algorithms.

## Repository Structure

```
GuitarTuner/
├── index.html          # Single-page UI shell
├── app.js              # All application logic (pitch detection + tuner UI)
├── audio-processor.js  # Legacy Google AudioProcessor (Polymer/ES6 module, not loaded by index.html)
└── style.css           # Full styling with CSS custom properties
```

### File Roles

| File | Role |
|---|---|
| `index.html` | Markup only — loads `style.css` and `app.js`. No JS frameworks. |
| `app.js` | Core application: `PitchDetector` base class, `YinDetector`, `AutocorrelationDetector`, and the `Tuner` orchestrator. |
| `style.css` | Dark-theme glassmorphism UI using CSS custom properties (no preprocessor). |
| `audio-processor.js` | Archived legacy source from the original Google Web Starter Kit demo. Uses Polymer and `import` syntax; **not used at runtime** — kept for reference only. |

## Architecture

### Pitch Detection (Strategy Pattern)

`app.js` uses the Strategy design pattern for swappable pitch detection:

```
PitchDetector (abstract base)
├── YinDetector          — YIN algorithm (default, more accurate)
└── AutocorrelationDetector — Autocorrelation (faster, simpler)
```

Both implement a single method:
```js
getPitch(float32AudioBuffer, sampleRate) -> Hz | -1
```

`-1` signals no pitch detected (silence / noise gate failed).

### Tuner Class

`Tuner` owns the Web Audio API lifecycle and all DOM interaction:

- **`start()`** — requests microphone access, creates `AudioContext`, wires `MediaStreamSource → AnalyserNode`.
- **`update()`** — RAF loop: reads float time-domain data, calls the active detector, applies a smoothing window (last N readings averaged), then delegates to `updateUI()`.
- **`updateUI(noteData)`** — updates note name, frequency display, needle position (mapped ±50 cents → 5–95%), and flat/sharp/in-tune indicators.
- **`getNote(frequency)`** — converts Hz to MIDI note, name, octave, and cents deviation using A4 = 440 Hz.
- **`stop()`** — closes `AudioContext`, resets UI.

### Configuration Constants

Defined in `TunerDefaults` at the top of `app.js`:

| Constant | Value | Meaning |
|---|---|---|
| `FFTSIZE` | `2048` | AnalyserNode FFT size (also the time-domain buffer length) |
| `SmoothingWindow` | `5` | Number of pitch readings averaged for needle smoothing |

### CSS Design Tokens

All colours are CSS custom properties on `:root` in `style.css`:

| Variable | Purpose |
|---|---|
| `--bg-color` | Page background |
| `--card-bg` | Tuner card (glassmorphism) |
| `--text-primary` | Primary text |
| `--text-secondary` | Muted text / inactive indicators |
| `--accent-color` | Note name, button gradient |
| `--success-color` | In-tune state (needle + note name) |
| `--warning-color` | Flat / sharp indicators |
| `--danger-color` | Error messages |
| `--needle-color` | Default needle colour |

## Development Workflow

### Running Locally

No build step. Serve the project root over HTTP (direct `file://` access blocks microphone permissions in most browsers):

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .

# VS Code Live Server extension also works
```

Then open `http://localhost:8080`.

### No Package Manager / No Build Tool

There is no `package.json`, `webpack`, `vite`, or any bundler. Do **not** add one unless explicitly required. Keep changes in plain HTML/CSS/JS.

### No Test Suite

There are no automated tests. Manual testing via a browser with microphone access is the only verification method.

## Key Conventions

1. **Vanilla JS only** — no frameworks, no imports, no bundler. `app.js` is a plain script tag.
2. **Class-based OOP** — new pitch algorithms must extend `PitchDetector` and implement `getPitch(buffer, sampleRate)`.
3. **Register new detectors in `Tuner`** — add to `this.detectors` map and add a corresponding `<option>` in `index.html`.
4. **CSS custom properties** — use existing tokens for all colours. Do not hardcode hex/rgb values.
5. **`audio-processor.js` is reference only** — do not import or load it; it depends on Polymer which is not present.
6. **Tuning reference** — A4 = 440 Hz. Cent calculations use standard 12-TET: `cents = 1200 * log2(f / f_target)`.
7. **In-tune tolerance** — currently ±5 cents (`isPerfect = Math.abs(cents) < 5` in `updateUI`).
8. **Noise gate** — YIN rejects reads with probability < 0.6; Autocorrelation rejects RMS < 0.01. Keep these gates; removing them causes jitter on silence.

## Branch / Git Conventions

- Development branch: `claude/claude-md-mmcjx127o7mmwj1r-hHkSm`
- Main branch: `master`
- Commit style: `feat:`, `fix:`, `refactor:` prefixes (imperative, present tense).

## Browser Requirements

- Requires `getUserMedia` (microphone) — HTTPS or `localhost` only.
- Uses `AudioContext` / `webkitAudioContext` (prefixed fallback included).
- No IE support; modern evergreen browsers only.
