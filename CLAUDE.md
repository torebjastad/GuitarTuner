# CLAUDE.md — Guitar Tuner

## Project Overview

A lightweight, browser-based guitar tuner with no build step or external dependencies. It captures microphone audio via the Web Audio API and performs real-time pitch detection using one of three selectable algorithms.

## Repository Structure

```
GuitarTuner/
├── index.html                    # Single-page UI shell
├── app.js                        # All application logic (pitch detection + tuner UI + test tones)
├── style.css                     # Full styling with CSS custom properties
└── pitch-detection-algorithms.md # Detailed documentation of all three pitch detection algorithms
```

### File Roles

| File | Role |
|---|---|
| `index.html` | Markup only — loads `style.css` and `app.js`. No JS frameworks. |
| `app.js` | Core application: `PitchDetector` base class, `YinDetector`, `McLeodDetector`, `AutocorrelationDetector`, `Tuner` orchestrator, `DebugPlot`, and `TestToneGenerator`. |
| `style.css` | Dark-theme glassmorphism UI using CSS custom properties (no preprocessor). |
| `pitch-detection-algorithms.md` | In-depth documentation of all three pitch detection algorithms. |

## Architecture

### Pitch Detection (Strategy Pattern)

`app.js` uses the Strategy design pattern for swappable pitch detection:

```
PitchDetector (abstract base)
├── YinDetector              — YIN algorithm (accurate, CMND-based)
├── McLeodDetector           — McLeod MPM (default, adaptive threshold)
└── AutocorrelationDetector  — Autocorrelation (faster, simpler)
```

All implement a single method:
```js
getPitch(float32AudioBuffer, sampleRate) -> Hz | -1
```

`-1` signals no pitch detected (silence / noise gate failed).

### Tuner Class

`Tuner` owns the Web Audio API lifecycle and all DOM interaction:

- **`start()`** — requests microphone access, creates `AudioContext`, wires `MediaStreamSource → AnalyserNode`.
- **`update()`** — RAF loop: reads float time-domain data, calls the active detector, rejects octave-jump outliers, detects genuine note changes (resets smoothing buffer after 3+ consecutive different-note readings), applies median smoothing (last N readings), then delegates to `updateUI()`.
- **`updateUI(noteData)`** — updates note name, frequency display, needle position (mapped ±50 cents → 5–95%), and flat/sharp/in-tune indicators.
- **`getNote(frequency)`** — converts Hz to MIDI note, name, octave, and cents deviation using A4 = 440 Hz.
- **`stop()`** — closes `AudioContext`, resets UI.

### TestToneGenerator Class

`TestToneGenerator` produces realistic guitar-like test tones using Web Audio oscillators. It synthesizes harmonics with per-string amplitude profiles, pluck envelopes, a shared vibrato LFO, and noise to simulate each of the six standard-tuning strings (E2–E4). All harmonics share a single vibrato oscillator (realistic: one string = one vibrato source). Useful for testing the tuner without a physical guitar.

### DebugPlot Class

`DebugPlot` renders a real-time canvas visualization for the active algorithm when the "Show Algorithm Debug" checkbox is enabled. It supports three drawing modes:

- **YIN:** Draws the CMND curve with threshold lines (step 3 threshold at 0.1, octave-correction threshold at 0.3), initial/corrected tau markers with arrows, and the parabolic-interpolated final tau (green triangle).
- **McLeod MPM:** Draws the NSDF curve with positive/negative lobes, key maxima (orange dots), the selected peak (red dot), relative threshold line, and interpolated tau.
- **Autocorrelation:** Draws the autocorrelation function, first-dip marker, detected peak, and interpolated T₀.

All modes include an info panel showing algorithm name, frequency, tau, confidence/clarity, and CPU load (avg/peak/percentage).

Debug data capture is gated behind each detector's `.debug = true` flag to avoid overhead when not in use.

### Configuration Constants

Defined in `TunerDefaults` at the top of `app.js`:

| Constant | Value | Meaning |
|---|---|---|
| `FFTSIZE` | `4096` | AnalyserNode FFT size (also the time-domain buffer length). Larger buffer for reliable low-frequency detection. |
| `SmoothingWindow` | `20` | Number of pitch readings used for median smoothing (adjustable via UI slider) |
| `MIN_FREQUENCY` | `30` | Minimum detectable frequency (Hz). Limits tau search range in all algorithms. |
| `MAX_FREQUENCY` | `3000` | Maximum detectable frequency (Hz). Filters out-of-range readings and sets minimum tau. |

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
5. **Frequency range** — `MIN_FREQUENCY` and `MAX_FREQUENCY` in `TunerDefaults` control both the post-detection filter and the tau search range in all three algorithms. Lowering `MIN_FREQUENCY` increases CPU cost.
6. **Tuning reference** — A4 = 440 Hz. Cent calculations use standard 12-TET: `cents = 1200 * log2(f / f_target)`.
7. **In-tune tolerance** — currently ±5 cents (`isPerfect = Math.abs(cents) < 5` in `updateUI`).
8. **Noise gate** — YIN rejects reads with probability < 0.6; McLeod rejects clarity < 0.5; Autocorrelation rejects RMS < 0.01. Keep these gates; removing them causes jitter on silence.

## Branch / Git Conventions

- Development branch: `claude/claude-md-mmcjx127o7mmwj1r-hHkSm`
- Main branch: `master`
- Commit style: `feat:`, `fix:`, `refactor:` prefixes (imperative, present tense).

## Browser Requirements

- Requires `getUserMedia` (microphone) — HTTPS or `localhost` only.
- Uses `AudioContext` / `webkitAudioContext` (prefixed fallback included).
- No IE support; modern evergreen browsers only.

## Documentation Convention

Important knowledge — algorithms, architecture decisions, debugging insights — should be documented in an appropriate `.md` file in the repository. When existing documentation becomes outdated or incorrect due to code changes, update or correct it. See `pitch-detection-algorithms.md` for an example.