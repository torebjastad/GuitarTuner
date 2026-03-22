# Piano Pitch Variation Analysis

## Why Does Strike Velocity Affect the Detected Pitch?

When tuning a piano with a pitch detector, playing a key very hard (ff) and then very gently (pp) can produce readings that differ by up to **15 cents** in the bass register. This document explains the two root causes, the experimental evidence, and the algorithmic solutions implemented in `key_specific_detector.py`.

---

## Root Cause 1: Attack Transient (Time-Dependent Variation)

The first 50–200 ms after a key is struck is dominated by hammer impact noise, string startup transients, and soundboard resonance. The waveform during this phase is **not periodic** — it is broadband noise briefly interrupted by irregular impulses.

Any pitch detector fed this non-periodic signal will return unreliable readings. On studio recordings (Salamander Grand Piano) this phase is short and the NSDF clarity stays above 0.83 even during the attack. On a real piano recorded with a phone microphone the transient is louder, room reflections add to the mess, and NSDF clarity during the attack typically falls to 0.3–0.6.

**Effect by velocity:** At ff the hammer contact time is shorter, the initial impulse is larger, and the non-periodic phase lasts longer than at pp. This means the attack transient window during which a detector is unreliable is **velocity-dependent**: a harder strike keeps the detector uncertain for longer.

### Pitch vs. Time Profile

For a hard (ff) strike, the pitch detected by NSDF follows a characteristic arc:

| Time after onset | Phase | NSDF clarity | Pitch reading |
|------------------|-------|-------------|---------------|
| 0–150 ms | Attack transient | 0.3–0.6 | Unreliable, often sharp |
| 150–400 ms | Pitch glide | 0.6–0.85 | Drifting toward steady state |
| 400–1200 ms | Stable sustain | 0.85–0.97 | Reliable, mostly settled |
| 1200 ms+ | Decay / noise floor | Falling | Reliability degrades again |

For a gentle (pp) strike the attack phase is very short and the pitch settles quickly. The stable-sustain readings agree between pp and ff within 1–2 cents.

**Practical implication:** A clarity gate (reject windows where NSDF clarity < 0.65) automatically skips the transient phase regardless of how hard the key is struck.

---

## Root Cause 2: NSDF Inharmonicity Bias (Velocity-Dependent Algorithm Error)

Even in the stable sustain phase, NSDF-based detectors (autocorrelation, McLeod MPM, YIN) exhibit a systematic pitch shift that grows with strike velocity. The mechanism:

1. **Piano strings are stiff.** Overtones are stretched above integer multiples of f₀ by the inharmonicity coefficient B. For a typical bass string at C2, B ≈ 0.0003, which places the 5th partial about 3¢ above 5×f₀.
2. **Hard strikes put more energy into upper partials.** At ff, partials 3–8 can contain more energy than the fundamental.
3. **NSDF optimises the sum of harmonic correlations.** When high-amplitude inharmonic upper partials dominate, the lag that maximises the NSDF shifts slightly short of the true fundamental period.
4. **Result:** The detected frequency drifts sharp proportionally to the upper-partial energy — monotonically from pp to ff.

### Measured Spread (Salamander Grand Piano, 16 velocity layers)

All measurements use the late-sustain window (400–1200 ms) to exclude transient effects.

| Note | ET freq | NSDF spread v1–v16 | Harmonic-fit spread v1–v16 | Harmonic-fit spread v4–v16 |
|------|---------|--------------------|-----------------------------|------------------------------|
| A0   | 27.5 Hz | ~8–9 ¢             | ~3 ¢                        | ~2 ¢                         |
| C1   | 32.7 Hz | ~1–2 ¢             | ~2 ¢                        | ~1 ¢                         |
| A1   | 55.0 Hz | ~10–13 ¢           | ~4 ¢                        | ~2 ¢                         |
| C2   | 65.4 Hz | ~12–15 ¢           | ~6 ¢                        | ~2 ¢                         |

C1 is an outlier where NSDF performs well: the fundamental is strong at all velocities (the string is long and its B coefficient is small relative to C2), so NSDF latches onto the correct period.

---

## What Is the "True" Pitch of a Note?

For C2 in the Salamander dataset the NSDF spread across velocity layers is 15 ¢. The spectral analysis shows the fundamental (65.0 Hz, approximately −11 ¢ from ET) is present and consistent at all velocities in the FFT — NSDF simply doesn't weight it correctly when upper partials dominate.

**The "true" pitch** for piano tuning purposes is the fundamental frequency f₀, which is what the piano was tuned to. NSDF reads anywhere from −8 ¢ to +8 ¢ for C2 depending on velocity — all of this is algorithmic artefact.

The harmonic fit approach (described below) reads −10 to −11 ¢ consistently for v4–v16, agreeing with the direct spectral measurement of the fundamental.

---

## Solutions

### Solution 1: Measure in the Late-Sustain Window

Restrict pitch readings to 400–1200 ms after note onset. This avoids the attack transient and most of the pitch glide. NSDF spread drops from ~15 ¢ to ~5–6 ¢ for C2.

Implemented via the adaptive transient-skip in `piano-scanner.js`:

```
transient_ms = max(ONSET_TRANSIENT_MS, round(5000 / expected_hz))
```

This ensures at least 5 full fundamental periods are skipped after onset before sampling begins:

| Note | Expected Hz | Transient skip |
|------|-------------|----------------|
| A0   | 27.5 Hz     | 182 ms         |
| C1   | 32.7 Hz     | 153 ms         |
| E1   | 41.2 Hz     | 122 ms         |
| A1   | 55.0 Hz     | 91 ms          |
| C2   | 65.4 Hz     | 77 ms          |
| C3+  | ≥130 Hz     | 60 ms (floor)  |

### Solution 2: NSDF Clarity Gate

Reject any analysis window where the NSDF peak height ("clarity") is below 0.65. Clarity close to 1.0 indicates a strongly periodic signal (stable sustain); clarity below 0.65 indicates noise or transient. The gate fires during the non-periodic attack phase and prevents unreliable readings from entering the pitch estimate.

Implemented in `KeySpecificDetector.detect()` via `nsdf_clarity()`:

```python
_, clarity = KeySpecificDetector.nsdf_clarity(buffer, sample_rate)
if clarity < self.min_clarity:   # self.min_clarity = 0.65 by default
    return -1   # still in transient phase — reject this window
```

**Caveat:** Studio recordings (Salamander) have clarity 0.83–0.96 even during the attack, so the gate has minimal effect on those recordings. On real piano + phone microphone recordings the gate is essential.

### Solution 3: Harmonic Partial Fitting (Primary Algorithmic Fix)

`KeySpecificDetector.detect_harmonic_fit()` addresses the inharmonicity bias directly:

1. Compute a high-resolution magnitude spectrum (≥131072-point FFT, zero-padded).
2. Find all strong spectral peaks up to `max_harmonic × expected_freq`.
3. For each peak near `n × expected_freq` (n = 1 … max_harmonic), derive `f₀ = peak_freq / n`.
4. Return the **median** of all f₀ estimates.

Because the median is taken over all detectable partials (typically 5–12 for bass notes), no single partial — whether the weak fundamental or the dominant 5th partial — dominates the result. The estimate is robust to velocity-dependent changes in harmonic energy distribution.

**Measured improvement:**

| Note | NSDF v1–v16 spread | Harmonic fit v1–v16 | Harmonic fit v4–v16 |
|------|--------------------|-----------------------|----------------------|
| C2   | 15.4 ¢             | 5.7 ¢                 | **~2 ¢**             |
| A1   | ~13 ¢              | ~4 ¢                  | **~2 ¢**             |

For notes at or below C1 (32.7 Hz), the fundamental remains strong at all velocities and NSDF already gives 1–2 ¢ spread. Harmonic fit offers no advantage there.

**When to prefer which method:**

| Note range | Recommended method |
|------------|--------------------|
| Below ~55 Hz (A1 and lower) | NSDF (`detect()`) — fundamental always strong |
| 55–500 Hz | Harmonic fit (`detect_harmonic_fit()`) — more robust |
| Above 500 Hz | Either — inharmonicity effect is smaller |

---

## Practical Recommendation for Piano Tuning

- **Play at mp–mf dynamics** (not pp, not ff) for the most reproducible results with any algorithm. This is consistent with ETD (Electronic Tuning Device) literature (TuneLab, Verituner, PianoMeter all recommend mezzo-forte).
  - pp: fewer/weaker harmonics, lower SNR, can miss the fundamental entirely.
  - ff: strong upper partials bias NSDF readings sharp; also longer transient.
- **Use the late-sustain window** (400–1200 ms after onset). The pitch glide effect settles by 400 ms for most notes.
- **For bass notes above ~55 Hz**, use `detect_harmonic_fit()` rather than `detect()` to eliminate velocity-dependent algorithmic bias.

---

## Visualisation

Three diagnostic plots are produced by `transient_analysis.py`:

| File | Content |
|------|---------|
| `transient_analysis_C1.png` | Per-velocity pitch vs. time curves, clarity vs. time, waveform with transient shading, spectrogram |
| `physics_explanation_C1.png` | Waveform + clarity, spectrum attack vs. sustain, NSDF attack vs. sustain — side-by-side comparison |
| `velocity_reproducibility.png` | Bar chart: 4 strategies × 16 velocity layers × 5 bass notes. Shows spread reduction from NSDF-early → NSDF-late → NSDF-stable → harmonic fit (orange) |

Run with:

```bash
# From PianoTunerPython/
.venv/Scripts/python.exe transient_analysis.py --repro   # velocity reproducibility plot
.venv/Scripts/python.exe transient_analysis.py --all     # all three plots for C1
.venv/Scripts/python.exe transient_analysis.py --note C --octave 2 --all  # for C2
```

---

## Relevant Code Files

| File | Role |
|------|------|
| `PianoTunerPython/key_specific_detector.py` | `KeySpecificDetector` — clarity gate, NSDF detect, harmonic fit |
| `PianoTunerPython/transient_analysis.py` | Analysis + visualisation tool |
| `PianoHealthAndTuningWebApp/app/piano-scanner.js` | Adaptive transient skip in JS scanning pipeline |
| `PianoHealthAndTuningWebApp/piano-scanning-algorithm.md` | JS scanning pipeline documentation |
