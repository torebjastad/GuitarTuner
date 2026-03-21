# Piano Scanning Algorithm

## Overview

`piano-scanner.js` implements the pitch-detection core for the PianoHelse web app. It measures the tuning deviation of each piano key by listening through the microphone and detecting the fundamental frequency of the played note. All results are stored as cents deviation from equal-temperament (12-TET) at A4 = 440 Hz.

---

## Class: PianoScanner

### Key Parameters

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `BUFFER_SIZE` | 8192 | Audio buffer length in samples (≈185 ms at 44 100 Hz) |
| `STABIL_TERSKEL` | 8 | Minimum confirmed pitch readings before accepting a result |
| `SAMLETID_MS` | 1000 | Collection window duration (1 second) |
| `MAKS_VENTETID_MS` | 10 000 | Per-key timeout before giving up |
| `GODKJENT_AVSTAND` | 0.45 semitones | Pitch readings outside this range from expected are rejected |
| `MIN_RMS` | 0.0001 | Absolute silence gate — frames below this are ignored |
| `MAKS_REL_STD` | 0.005 | Maximum relative standard deviation for stability check |
| `RMS_FALLOFF` | 0.15 | Early-exit trigger: if RMS drops below 15 % of peak |
| `ONSET_STILLE_RMS` | 0.005 | RMS must fall below this to be considered "silent" |
| `ONSET_ANSLAG_RMS` | 0.010 | RMS must rise above this to detect a new key press |
| `ONSET_STILLE_MS` | 150 | Minimum silence duration (ms) before listening for attack |
| `ONSET_STILLE_TIMEOUT_MS` | 4000 | Force-advance after 4 s of waiting for silence |

---

## Scanning Flow

### Full scan: `skannAlle(sekvens?)`

Iterates over a sequence of `noteIndex` values (default: white keys C1–A7, indices 3–84), calling `skannNote()` for each. `noteIndex` maps to MIDI note number via `midi = noteIndex + 21`.

```
startMikrofon()
  → skannNote(sekvens[0], erFørste=true)
  → skannNote(sekvens[1], erFørste=false)
  → …
  → onSkanningFullfort(resultater)
```

### Single note: `skannNote(noteIndex, erFørste?)`

Three-phase state machine running inside a `requestAnimationFrame` loop:

```
[vent_på_stille] → [vent_på_anslag] → [sampling] → result
```

---

## Phase 1: vent_på_stille (Wait for silence)

**Purpose:** Prevent the scanner from capturing reverb/sustain from the previous key.

**Skipped** when `erFørste = true` (first key in a sequence, or single-note re-scan).

**Logic:**
1. Read RMS of the current audio buffer.
2. If `RMS < ONSET_STILLE_RMS` → start or continue a silence timer (`stilleStartTid`).
3. Once silence has been continuous for `ONSET_STILLE_MS` (150 ms) → advance to Phase 2.
4. If RMS rises above `ONSET_STILLE_RMS` before 150 ms → reset the silence timer.
5. **Force advance** after `ONSET_STILLE_TIMEOUT_MS` (4 s) regardless — handles pianos with long sustain that never reach full silence.

**Why two conditions?**
- The minimum duration requirement (150 ms) prevents a brief RMS dip inside a sustained note from being mistaken for silence.
- The forced timeout prevents the scan from stalling indefinitely on pianos where low notes decay very slowly.

---

## Phase 2: vent_på_anslag (Wait for attack)

**Purpose:** Detect the start of the new key press.

**Logic:**
- If `RMS > ONSET_ANSLAG_RMS` → advance to Phase 3 (sampling).
- Otherwise loop until timeout.

`ONSET_ANSLAG_RMS` (0.010) is set above typical ambient room noise (0.001–0.005) but well below a clear piano keystroke.

---

## Phase 3: sampling (Pitch collection)

**Purpose:** Collect stable pitch readings and compute a median result.

Each RAF frame:
1. **RMS gate:** Skip if `RMS < MIN_RMS` (digital silence / noise floor).
2. **Pitch detection:** Call `UltimateDetector.getPitch(buffer, sampleRate)` → frequency in Hz, or −1.
3. **Proximity check:** Reject readings more than `GODKJENT_AVSTAND` semitones from expected frequency (catches octave errors and harmonic confusion).
4. **Accumulate:** Store `{hz, tid, rms}` in `avlesninger[]`.
5. **Early exit:** If `avlesninger.length ≥ STABIL_TERSKEL` AND `RMS < toppRms × RMS_FALLOFF` → the key has decayed; confirm early.
6. **Normal exit:** If `samletid ≥ SAMLETID_MS` AND `avlesninger.length ≥ STABIL_TERSKEL` → confirm after 1 second.
7. **Timeout:** After `MAKS_VENTETID_MS`, confirm if enough readings, otherwise mark as `ikke_detektert`.

---

## Pitch Detection Engine

### Stage 1 — Coarse detection: UltimateDetector

`UltimateDetector.getPitch()` is a three-stage hybrid (ported from Python `ultimate_detector.py`):

1. **McLeod MPM** — NSDF (Normalized Square Difference Function) via FFT-based autocorrelation. Finds the dominant period, robust for bass and mid-range.
2. **Frequency-weighted spectral peak** — 65 536-point FFT spectral analysis, picks the frequency bin with highest energy weighted by frequency (favours fundamental over harmonics).
3. **Decision engine** — Validates the MPM result against the spectral peak. If they agree within a threshold, uses the MPM result; otherwise falls back to the spectral peak. Rejects results with clarity < 0.4.

Returns Hz (fundamental frequency) or −1 on failure.

### Stage 2 — Fine refinement: DTFT

Applied only for notes ≥ 80 Hz (not bass — see below).

**Algorithm** (`PianoScanner.dtftRefine`):

1. Apply a Hanning window to the 8192-sample buffer.
2. **Coarse pass:** Evaluate DFT magnitude at 21 exact frequencies (−10 to +10 cents around the coarse result, 1-cent steps).
3. **Fine pass:** Evaluate at 41 frequencies (±2 cents around the coarse peak, 0.1-cent steps).
4. **Parabolic interpolation** on the fine-pass magnitude array for sub-0.1-cent resolution.

This is a Goertzel-like approach: computing the DFT at arbitrary non-FFT-bin frequencies. Yields sub-cent accuracy for the fundamental.

**Why skip bass (< 80 Hz)?**
At 80 Hz with 8192 samples (≈185 ms), only ~15 full periods fit in the buffer. Spectral peaks are broad, and the DTFT can be pulled toward sidebands rather than the true fundamental. The MPM result from UltimateDetector is more reliable for bass.

---

## Result Confirmation: `_bekreft()`

1. Collect all accepted `avlesninger[].hz` values.
2. Compute **median** (robust against outliers).
3. Apply **DTFT refinement** if `forventetHz ≥ 80 Hz`.
4. Compute `cents = 1200 × log₂(medianHz / idealHz)` using `PianoScanner.frekvensInfo()`.
5. Compute `klarhet = max(0, 1 − relStd × 200)` where `relStd` is the relative standard deviation of all pitch readings (lower spread = higher clarity).

Result object:
```js
{
  noteIndex, status: 'bekreftet',
  hz, cents, midi, noteNavn, oktav,
  klarhet, antallAvlesninger
}
```

---

## Note Index ↔ MIDI ↔ Frequency Mapping

```
noteIndex = MIDI - 21
MIDI 21 = A0,  noteIndex 0
MIDI 69 = A4,  noteIndex 48
MIDI 108 = C8, noteIndex 87

idealHz(noteIndex) = 440 × 2^((noteIndex + 21 - 69) / 12)
```

Scanning range: C1 (noteIndex 3, MIDI 24) to A7 (noteIndex 84, MIDI 105).

A0–B0 (noteIndex 0–2) are excluded — below reliable mobile-microphone range.
A#7–C8 (noteIndex 85–87) are excluded — extreme treble, high failure rate.

---

## Scanning Sequences

- **White keys only** (`_hviteTasterSekvens`): C, D, E, F, G, A, B in each octave, C1–A7 = 52 keys. Default for standard scan.
- **All keys** (`_alleTasterSekvens`): All 82 keys C1–A7. Selected via user toggle.

---

## Re-scan (single note)

`_startEnkeltNoteMåling(noteIndex)` in `app.js`:
- Creates a fresh `PianoScanner` instance with a new microphone session.
- Always uses `erFørste = true` → skips Phase 1 (silence wait), starts listening immediately.
- On success, updates `AppTilstand.skanneResultater[noteIndex]` and regenerates the tuning curve and health score.
