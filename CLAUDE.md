# CLAUDE.md — Guitar Tuner

## Project Overview

A lightweight, browser-based guitar tuner with no build step or external dependencies. It captures microphone audio via the Web Audio API and performs real-time pitch detection using one of six selectable algorithms.

## Repository Structure

```
GuitarTuner/
├── index.html                    # Single-page UI shell
├── pitch-common.js               # TunerDefaults, PitchDetector base class, PitchFFT utility
├── yin-detector.js               # YIN pitch detection algorithm (FFT-based)
├── autocorrelation-detector.js   # Autocorrelation pitch detection algorithm (FFT-based)
├── mcleod-detector.js            # McLeod Pitch Method (MPM) algorithm (FFT-based)
├── hps-detector.js               # Harmonic Product Spectrum (FFT-based) algorithm
├── music-detector.js             # MUSIC (subspace/eigendecomposition-based) algorithm
├── ultimate-detector.js          # Ultimate hybrid detector (MPM + spectral + decision engine)
├── debug-plot.js                 # Debug visualization (canvas plots for all algorithms)
├── tuner.js                      # Tuner orchestrator (Web Audio API, UI, smoothing)
├── test-tone-generator.js        # Realistic guitar test tone synthesis
├── app.js                        # Entry point (initialization only)
├── style.css                     # Full styling with CSS custom properties
├── test-bench.html               # Algorithm comparison test bench (batch testing against audio files)
├── focused-test.html             # Python-equivalent focused test harness for Ultimate detector
├── pitch-detection-algorithms.md # Detailed documentation of all six pitch detection algorithms
└── test-data-description.md      # Description of test datasets (Nylon, Plucked, UIowa Piano)
```

### File Roles

| File | Role |
|---|---|
| `index.html` | Markup — loads `style.css` and all JS files in dependency order. No JS frameworks. |
| `pitch-common.js` | Shared constants (`TunerDefaults`), `PitchDetector` abstract base class, and `PitchFFT` utility (radix-2 FFT/IFFT used by YIN, McLeod, Autocorrelation, and Ultimate). Loaded first. |
| `yin-detector.js` | `YinDetector` — YIN algorithm with FFT-based cross-correlation, CMND, bidirectional octave correction, 5-point interpolation. |
| `autocorrelation-detector.js` | `AutocorrelationDetector` — FFT-based autocorrelation with RMS gate and signal trimming. |
| `mcleod-detector.js` | `McLeodDetector` — McLeod MPM with FFT-based autocorrelation, cumulative-sum NSDF normalization, key maxima, relative threshold. |
| `hps-detector.js` | `HpsDetector` — Harmonic Product Spectrum with Blackman-Harris windowed FFT, adaptive-depth log-domain average, dual-criteria octave-error check, and SNR-weighted multi-harmonic DTFT refinement. |
| `music-detector.js` | `MusicDetector` — MUSIC (subspace) algorithm with Jacobi eigendecomposition of the autocorrelation matrix, pseudospectrum scanning, and harmonic validation. |
| `ultimate-detector.js` | `UltimateDetector` — Hybrid three-stage detector: McLeod MPM (FFT-based) + frequency-weighted spectral peak (65536-point FFT) + decision engine with harmonic verification. Ported from Python. |
| `debug-plot.js` | `DebugPlot` — Canvas-based real-time visualization for all six algorithms. |
| `tuner.js` | `Tuner` — Main orchestrator: Web Audio API, microphone, smoothing, UI updates. |
| `test-tone-generator.js` | `TestToneGenerator` — Guitar-like test tones with harmonics, vibrato, noise. |
| `app.js` | Entry point — instantiates `Tuner` and `TestToneGenerator`. |
| `style.css` | Dark-theme glassmorphism UI using CSS custom properties (no preprocessor). |
| `test-bench.html` | Standalone test bench — batch-runs all detectors against audio test files, with onset detection, configurable window size, averaging (ms), and per-algorithm checkboxes. Averages stereo channels. |
| `focused-test.html` | Python-equivalent focused test harness — tests Ultimate detector against 6 piano datasets with onset detection and tolerance tiers matching `PianoTunerPython/focused_test.py`. |
| `pitch-detection-algorithms.md` | In-depth documentation of all six pitch detection algorithms. |
| `test-data-description.md` | Descriptions and metadata for test audio datasets. |

## Architecture

### Pitch Detection (Strategy Pattern)

The codebase uses the Strategy design pattern for swappable pitch detection:

```
PitchDetector (abstract base)
├── YinDetector              — YIN algorithm (accurate, CMND-based, FFT-accelerated)
├── McLeodDetector           — McLeod MPM (default, adaptive threshold, FFT-accelerated)
├── AutocorrelationDetector  — Autocorrelation (simpler, FFT-accelerated)
├── HpsDetector              — Harmonic Product Spectrum (frequency domain, DTFT refinement)
├── MusicDetector            — MUSIC (subspace-based, eigendecomposition)
└── UltimateDetector         — Hybrid (MPM + spectral peak + decision engine, full piano range)
```

All time-domain detectors (YIN, McLeod, Autocorrelation) and the Ultimate detector use the shared `PitchFFT` utility for O(N log N) FFT-based correlation, replacing the original O(N²) direct loops.

All implement a single method:
```js
getPitch(float32AudioBuffer, sampleRate) -> Hz | -1
```

`-1` signals no pitch detected (silence / noise gate failed).

### Tuner Class

`Tuner` owns the Web Audio API lifecycle and all DOM interaction:

- **`start()`** — requests microphone access, creates `AudioContext`, wires `MediaStreamSource → AnalyserNode`.
- **`update()`** — RAF loop: reads float time-domain data, calls the active detector, then delegates to `_applySmoothing()` and `updateUI()`.
- **`_applySmoothing(frequency)`** — rejects octave-jump outliers, detects genuine note changes (resets smoothing buffer after 3+ consecutive different-note readings), applies median smoothing (last N readings). Shared by both mic and test sample paths.
- **`_buildParamsUI()`** — dynamically renders algorithm parameter sliders (from `getParams()`) with tooltips in the debug section.
- **`updateUI(noteData)`** — updates note name, frequency display, needle position (mapped ±50 cents → 5–95%), and flat/sharp/in-tune indicators.
- **`getNote(frequency)`** — converts Hz to MIDI note, name, octave, and cents deviation using A4 = 440 Hz. Returns `null` for invalid frequency (-1).
- **`_playTestAudio(forcePlay)`** — loads, caches, and plays test audio samples through an inline AnalyserNode for real-time detection during playback. Uses `_testPlayId` to guard against race conditions from rapid tone switching.
- **`stop()`** — closes `AudioContext`, resets UI.

### TestToneGenerator Class

`TestToneGenerator` produces realistic guitar-like test tones using Web Audio oscillators. It synthesizes harmonics with per-string amplitude profiles, pluck envelopes, a shared vibrato LFO, and noise to simulate each of the six standard-tuning strings (E2–E4). All harmonics share a single vibrato oscillator (realistic: one string = one vibrato source). Useful for testing the tuner without a physical guitar.

### DebugPlot Class

`DebugPlot` renders a real-time canvas visualization for the active algorithm when the "Show Algorithm Debug" checkbox is enabled. It supports five drawing modes:

- **YIN:** Draws the CMND curve with threshold lines (step 3 threshold at 0.1, octave-correction thresholds at 0.3/0.5), initial/corrected tau markers with arrows, and the parabolic-interpolated final tau (green triangle).
- **McLeod MPM:** Draws the NSDF curve with positive/negative lobes, key maxima (orange dots), the selected peak (red dot), relative threshold line, and interpolated tau.
- **Autocorrelation:** Draws the autocorrelation function, first-dip marker, detected peak, and interpolated T₀.
- **HPS:** Draws the magnitude spectrum (faint blue) and HPS product spectrum (green) on a frequency (Hz) x-axis, with detected peak (red dot) and DTFT-refined frequency (green triangle). Shows both DTFT-refined and HPS-only frequencies for comparison.
- **MUSIC:** Dual-panel display. Upper panel shows the eigenvalue spectrum (bar chart, log scale) with signal subspace (orange) and noise subspace (gray) separated by a dashed boundary. Lower panel shows the MUSIC pseudospectrum (dB) with detected peaks (red dots) and identified fundamental (green triangle).
- **Ultimate:** Dual-panel display. Upper panel shows the NSDF curve (MPM stage) with key maxima and selected peak. Lower panel shows the frequency-weighted spectral magnitude with the spectral peak and final decision. Info panel includes decision reason and both candidate frequencies.

All modes include an info panel showing algorithm name, frequency, confidence/clarity metrics, and CPU load (avg/peak/percentage).

Debug data capture is gated behind each detector's `.debug = true` flag to avoid overhead when not in use.

### Configuration Constants

Defined in `TunerDefaults` in `pitch-common.js`:

| Constant | Value | Meaning |
|---|---|---|
| `FFTSIZE` | `4096` | AnalyserNode FFT size (also the time-domain buffer length). Larger buffer for reliable low-frequency detection. |
| `SmoothingWindow` | `20` | Number of pitch readings used for median smoothing (adjustable via UI slider) |
| `MIN_FREQUENCY` | `20` | Minimum detectable frequency (Hz). Limits tau search range in all algorithms. |
| `MAX_FREQUENCY` | `5000` | Maximum detectable frequency (Hz). Filters out-of-range readings and sets minimum tau. |

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

### Testing

There is no automated test framework. Testing is done manually:
- **Live tuner:** Open `index.html` via a local HTTP server with microphone access.
- **Test bench:** Open `test-bench.html` to batch-test all algorithms against audio files (Nylon Guitar, Plucked Guitar, UIowa Piano). Supports configurable sample offset, window size, averaging duration (ms), and per-algorithm selection via checkboxes.
- **Test samples in debug mode:** The main tuner UI exposes dataset/tone dropdowns and a mic-mute option when debug mode is enabled (only available locally; gracefully hidden on deployments where test files are absent).

## Key Conventions

1. **Vanilla JS only** — no frameworks, no imports, no bundler. All JS files are plain script tags loaded in dependency order.
2. **Class-based OOP** — new pitch algorithms must extend `PitchDetector` and implement `getPitch(buffer, sampleRate)`.
3. **Register new detectors in `Tuner`** — add to `this.detectors` map and add a corresponding `<option>` in `index.html`.
4. **CSS custom properties** — use existing tokens for all colours. Do not hardcode hex/rgb values.
5. **Frequency range** — `MIN_FREQUENCY` and `MAX_FREQUENCY` in `TunerDefaults` control both the post-detection filter and the tau/bin search range in most algorithms. The Ultimate detector has no upper frequency limit (to handle the full piano range). Lowering `MIN_FREQUENCY` increases CPU cost.
6. **Tuning reference** — A4 = 440 Hz. Cent calculations use standard 12-TET: `cents = 1200 * log2(f / f_target)`.
7. **In-tune tolerance** — currently ±5 cents (`isPerfect = Math.abs(cents) < 5` in `updateUI`).
8. **Noise gates & Parameters** — YIN rejects reads with probability < 0.6; McLeod rejects clarity < 0.5; Autocorrelation rejects RMS < 0.002; HPS rejects RMS < 0.002 and SNR < 0.8 (log-domain); MUSIC rejects RMS < 0.002 and eigenvalue gap ratio < 2.0; Ultimate rejects clarity < 0.4 (no RMS gate). These and other algorithm parameters are exposed dynamically via `PitchDetector.getParams()` / `setParam()`, rendered as sliders in the debug UI.

## Branch / Git Conventions

- Main branch: `main`
- Commit style: `feat:`, `fix:`, `refactor:` prefixes (imperative, present tense).

## Browser Requirements

- Requires `getUserMedia` (microphone) — HTTPS or `localhost` only.
- Uses `AudioContext` / `webkitAudioContext` (prefixed fallback included).
- No IE support; modern evergreen browsers only.

## Documentation Convention

Important knowledge — algorithms, architecture decisions, debugging insights — should be documented in an appropriate `.md` file in the repository. When existing documentation becomes outdated or incorrect due to code changes, update or correct it. See `pitch-detection-algorithms.md` for an example.

**Algorithm documentation must be kept in sync with code.** Every time an algorithm is changed — parameters, logic, thresholds, data flow — the corresponding `.md` file must be updated in the same commit. The canonical algorithm docs are:

| Code file | Documentation |
|-----------|--------------|
| `pitch-detection-algorithms.md` | Guitar tuner pitch detection algorithms |
| `PianoHealthAndTuningWebApp/piano-scanning-algorithm.md` | Piano scanning onset detection and pitch detection pipeline |
| `PianoTunerPython/key_specific_detector.py` | `PianoTunerPython/piano-pitch-variation-analysis.md` — velocity-dependent pitch bias, attack transients, harmonic fit algorithm |