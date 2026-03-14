# Ultimate Piano Detector — Algorithm Reference

Hybrid pitch detection algorithm designed for piano audio. Combines McLeod Pitch Method (time-domain) with a frequency-weighted spectral peak (frequency-domain) and harmonic verification to handle the full 88-key range, including the problematic high octaves where MPM fails due to sympathetic resonance and hammer thud energy.

This document describes every step in implementation detail, intended as a porting reference for JavaScript (Web Audio API).

---

## Architecture Overview

```
Input buffer (float32, typically 8192 samples)
         │
         ├──► Stage 1: McLeod MPM  ──► mpm_freq (or -1)
         │
         └──► Stage 2: Weighted Spectral Peak  ──► w_peak_freq
                        │
                        ▼
              Stage 3: Decision Engine
              (compare mpm_freq vs w_peak_freq,
               harmonic verification when needed)
                        │
                        ▼
                   final_freq
```

---

## Parameters

| Parameter     | Default | Description                                              |
|---------------|---------|----------------------------------------------------------|
| `cutoff`      | 0.93    | McLeod relative threshold (fraction of best key maximum) |
| `small_cutoff`| 0.40    | McLeod minimum clarity gate                              |

---

## Stage 1: McLeod Pitch Method (MPM)

### 1.1 Input

- `buffer`: float32 audio samples, length `N` (typically 8192)
- `sample_rate`: e.g. 44100 or 48000

### 1.2 Max tau

```
max_tau = min(N / 2, ceil(sample_rate / 20))
```

This sets the lowest detectable frequency to 20 Hz. For 48 kHz SR, `max_tau = 2400`. For 44.1 kHz, `max_tau = 2205`.

### 1.3 Autocorrelation (ACF) — FFT-based O(N log N)

The autocorrelation is computed via FFT convolution rather than direct summation. This reduces complexity from O(N²) to O(N log N), which is critical for large buffer sizes.

**Direct method (O(N²) — avoid for large N):**
```
for tau = 0 to max_tau-1:
    acf[tau] = sum(buffer[i] * buffer[i + tau])  for i = 0..N-tau-1
```

**FFT-based method (O(N log N) — used in this implementation):**
```
n_fft = next_power_of_2(2 * N)       // e.g. N=8192 → n_fft=16384
X = rfft(buffer, length=n_fft)        // Zero-pads to n_fft automatically
r_full = irfft(X * conj(X), length=n_fft)
acf = r_full[0 .. max_tau-1]
```

This exploits the convolution theorem: autocorrelation `r[τ] = Σ x[n]·x[n+τ]` equals `IFFT(|FFT(x)|²)`.

**Performance impact:** For `N = 8192`, the direct method takes ~1ms (fine for real-time). For `N = 65536` (used in offline analysis), the direct method takes several seconds while the FFT method takes ~7ms — a 100x+ speedup.

**JS porting — this is where the biggest speedup comes from:**
```js
// FFT-based autocorrelation for McLeod MPM
const nFft = nextPowerOf2(2 * buffer.length);
const X = fft(buffer, nFft);           // Zero-pad buffer to nFft
const powerSpectrum = X.map(z => z * conj(z));  // |X|²
const rFull = ifft(powerSpectrum);      // Real-valued result
const acf = rFull.slice(0, maxTau);     // Only need first maxTau lags
```

For the existing JS McLeod implementation (`mcleod-detector.js`), which uses a direct nested loop for NSDF, switching to this FFT-based approach would give a significant speedup and allow larger buffer sizes (e.g. 16384 or 32768) without frame drops. The Web Audio `AnalyserNode` FFT or any JS FFT library can be used.

### 1.4 Normalizing denominator m(tau) — Vectorized

The NSDF normalization denominator `m(τ)` represents the total energy available at each lag. It can be computed efficiently using cumulative sums instead of a running subtraction loop.

**Running subtraction (original McLeod paper):**
```
sq[i] = buffer[i]²
m[0] = 2 * sum(sq)
for tau = 1 to max_tau-1:
    m[tau] = m[tau-1] - sq[N - tau] - sq[tau - 1]
```

**Cumulative sum method (vectorized, used in this implementation):**
```
sq = buffer²                           // element-wise
sum_sq = sum(sq)
cumsum_sq = cumulative_sum(sq)         // cumsum_sq[i] = sq[0] + sq[1] + ... + sq[i]

m[0] = 2 * sum_sq
for tau = 1 to max_tau-1:
    // Energy of buffer[tau..N-1] + energy of buffer[0..N-tau-1]
    m[tau] = (sum_sq - cumsum_sq[tau - 1]) + cumsum_sq[N - tau - 1]
```

Both methods produce identical results. The cumulative sum approach vectorizes cleanly in numpy/JS typed arrays by computing all `m[1..max_tau-1]` in a single array operation.

**JS porting:**
```js
const sq = buffer.map(x => x * x);
const sumSq = sq.reduce((a, b) => a + b, 0);
const cumSq = new Float32Array(N);
cumSq[0] = sq[0];
for (let i = 1; i < N; i++) cumSq[i] = cumSq[i - 1] + sq[i];

const m = new Float32Array(maxTau);
m[0] = 2 * sumSq;
for (let tau = 1; tau < maxTau; tau++) {
    m[tau] = (sumSq - cumSq[tau - 1]) + cumSq[N - tau - 1];
}
```

### 1.5 NSDF (Normalized Square Difference Function)

```
nsdf[tau] = 2 * acf[tau] / m[tau]    if m[tau] > 0
nsdf[tau] = 0                         otherwise
```

Values range from -1 to +1. A value near +1 at lag `tau` means the signal is highly periodic with period `tau` samples.

### 1.6 Key maxima extraction

Walk through `nsdf[1..max_tau-1]` and find the peak of each positive lobe:

```
key_maxima = []
in_positive_region = false
current_max_tau = 0
current_max_val = -Infinity

for tau = 1 to max_tau-1:
    if nsdf[tau] > 0 AND nsdf[tau-1] <= 0:
        // Entering positive region
        in_positive_region = true
        current_max_tau = tau
        current_max_val = nsdf[tau]

    else if nsdf[tau] <= 0 AND nsdf[tau-1] > 0:
        // Leaving positive region — save peak
        if in_positive_region:
            key_maxima.append( (current_max_tau, current_max_val) )
        in_positive_region = false

    else if in_positive_region AND nsdf[tau] > current_max_val:
        // Update peak within positive region
        current_max_tau = tau
        current_max_val = nsdf[tau]

// Don't forget trailing positive region
if in_positive_region:
    key_maxima.append( (current_max_tau, current_max_val) )
```

**Early exit:** If `key_maxima` is empty, return -1 (no pitch).

### 1.7 Clarity gate

```
nmax = max(val for all key_maxima)
if nmax < small_cutoff (0.40):
    return -1   // Signal too noisy / unclear
```

### 1.8 Relative threshold selection

```
threshold = cutoff * nmax    // 0.93 * nmax

selected_peak = first key_maximum where val >= threshold
```

This picks the **first** (smallest tau = highest frequency) peak that exceeds the threshold, avoiding octave-drop errors.

**If no peak exceeds threshold:** return -1.

### 1.9 Parabolic interpolation

Refine the integer tau to sub-sample precision using 3-point parabolic interpolation:

```
tau_int = round(selected_tau)

if 0 < tau_int < max_tau - 1:
    s0 = nsdf[tau_int - 1]
    s1 = nsdf[tau_int]
    s2 = nsdf[tau_int + 1]

    a = (s0 + s2 - 2*s1) / 2
    b = (s2 - s0) / 2

    if a < 0:                  // Concave (valid peak)
        adj = -b / (2*a)
        if abs(adj) < 1:       // Sanity check
            interpolated_tau = tau_int + adj
```

### 1.10 MPM result

```
mpm_freq = sample_rate / interpolated_tau
```

---

## Stage 2: Frequency-Weighted Spectral Peak

### 2.1 High-resolution FFT

```
fft_size = 65536
window = hanning(N)             // N = buffer length (8192)

padded = zeros(fft_size)
padded[0..N-1] = buffer * window

spectrum = rfft(padded)         // Length: fft_size/2 + 1 = 32769
mag = abs(spectrum)

bin_hz = sample_rate / fft_size
```

**Why 65536?** Zero-padding to 64k gives ~0.73 Hz bin resolution at 48 kHz SR. This is critical for separating closely-spaced harmonics in the upper octaves.

**JS porting note:** Use Web Audio's built-in FFT or a JS FFT library. The `rfft` returns only the positive-frequency half (DC to Nyquist). In JS with a full FFT, take bins `0..fft_size/2`.

### 2.2 Frequency range

```
min_bin = floor(25 / bin_hz)       // ~25 Hz lower bound
max_bin = floor(10000 / bin_hz)    // 10 kHz upper bound
```

### 2.3 Frequency weighting (highpass)

```
valid_mag   = mag[min_bin .. max_bin-1]
valid_freqs = [min_bin * bin_hz, (min_bin+1) * bin_hz, ..., (max_bin-1) * bin_hz]

weighted_mag = valid_mag * valid_freqs    // element-wise multiply
```

This is a linear (+6 dB/octave) highpass weighting. It suppresses the low-frequency hammer thud and mechanical resonance energy that dominates in piano recordings, especially for high notes where the fundamental is weak relative to low-frequency structural noise.

### 2.4 Find weighted peak

```
peak_idx = argmax(weighted_mag)
w_peak_bin = min_bin + peak_idx
```

### 2.5 Parabolic interpolation on the RAW magnitude

Use the **unweighted** magnitude for interpolation (the weighting is only for peak selection):

```
alpha = mag[w_peak_bin - 1]
beta  = mag[w_peak_bin]
gamma = mag[w_peak_bin + 1]

numerator   = 0.5 * (alpha - gamma)
denominator = alpha - 2*beta + gamma

adj = numerator / denominator    // 0 if denominator == 0

w_peak_freq = (w_peak_bin + adj) * bin_hz
```

---

## Stage 3: Decision Engine

The decision engine chooses between `mpm_freq` and `w_peak_freq`. The logic only activates when the weighted spectral peak is above 1000 Hz, because below 1000 Hz the MPM result is generally reliable and the weighted peak is less meaningful.

### 3.1 Guard condition

```
if w_peak_freq <= 1000 OR mpm_freq <= 0:
    final_freq = mpm_freq       // Trust MPM for low/mid frequencies
    skip to 3.7 (fallback)
```

### 3.2 Ratio analysis

```
ratio = w_peak_freq / mpm_freq
closest_int = round(ratio)
```

If MPM and the spectral peak are harmonically related, the ratio will be close to an integer (1, 2, 3, ...). For example, if MPM locked onto the fundamental and the weighted peak found the 2nd harmonic, ratio ~ 2.0.

### 3.3 Branch: Small ratio (closest_int ≤ 8)

When the ratio is a small integer, the two candidates are likely harmonically related. Use a direct power comparison to decide which is the true fundamental.

#### 3.3.1 Check harmonic relation

```
is_close_to_int = abs(ratio - closest_int) < 0.2
```

**If NOT close to integer:** MPM locked on noise (not harmonically related to the spectral peak). Use `w_peak_freq`.

**If close to integer:** They are harmonically related. Proceed to power comparison.

#### 3.3.2 Power comparison

Look up the raw FFT magnitude at each candidate frequency, using a 5-bin window to handle spectral smearing:

```
function get_raw_power(freq):
    bin = round(freq / bin_hz)
    if bin <= 0 or bin >= len(mag) - 1: return 0
    return max( mag[max(1, bin-2) .. min(len(mag), bin+3)] )

pwr_mpm   = get_raw_power(mpm_freq)
pwr_wpeak = get_raw_power(w_peak_freq)
```

Choose a threshold multiplier based on the spectral peak frequency:

```
if w_peak_freq > 1800:
    threshold_mult = 0.8     // High notes: spectral peak is almost certainly the true note
else:
    threshold_mult = 0.05    // Lower range: could be a legitimate overtone, let MPM prove itself easily
```

**Rationale:** Above 1800 Hz, a note rarely has a dominant 7th+ overtone that would trick the weighted peak. Below 1800 Hz, the weighted peak might be an overtone of a low note where MPM correctly found the fundamental.

```
if pwr_mpm > pwr_wpeak * threshold_mult:
    final_freq = mpm_freq       // MPM fundamental has enough spectral power
else:
    final_freq = w_peak_freq    // MPM locked on subharmonic / octave drop
```

### 3.4 Branch: Large ratio (closest_int > 8) — Harmonic Verification

When the ratio exceeds 8, the relationship between candidates is too distant for a simple power comparison. Instead, perform full harmonic verification: count how many spectral peaks align with integer multiples of each candidate, and compare total harmonic power.

**Why this is needed:** Low piano notes (A0–C2) have strong upper harmonics. The frequency-weighted spectral peak will often find the 10th–30th partial, giving ratios of 10–66. But MPM correctly identifies the fundamental via time-domain periodicity. Without harmonic verification, these correct MPM results would be discarded.

#### 3.4.1 Find spectral peaks

Scan the FFT magnitude for local maxima above 10% of the global maximum, with parabolic interpolation:

```
peaks = []
threshold = max(mag[min_bin..max_bin]) * 0.1

for i = min_bin+1 to max_bin-1:
    if mag[i] > mag[i-1] AND mag[i] > mag[i+1] AND mag[i] > threshold:
        // Parabolic refinement
        a = mag[i-1]; b = mag[i]; c = mag[i+1]
        d = a - 2*b + c
        adj = 0.5 * (a - c) / d    // 0 if d == 0
        peaks.append( ((i + adj) * bin_hz, mag[i]) )
```

#### 3.4.2 Count harmonic hits

For each candidate frequency (MPM and w_peak), count how many spectral peaks fall near integer multiples:

```
function count_harmonic_hits(peaks, f0_candidate, base_tolerance=0.04):
    hits = 0
    total_power = 0
    for (freq, power) in peaks:
        ratio = freq / f0_candidate
        nearest_n = round(ratio)
        if nearest_n < 1: continue
        // Tolerance grows with harmonic number (piano inharmonicity)
        tol = base_tolerance + 0.005 * nearest_n
        if abs(ratio - nearest_n) < tol:
            hits += 1
            total_power += power
    return hits, total_power

mpm_hits, mpm_hpwr   = count_harmonic_hits(peaks, mpm_freq)
wpeak_hits, wpeak_hpwr = count_harmonic_hits(peaks, w_peak_freq)
```

**Inharmonicity tolerance:** Piano strings exhibit inharmonicity where upper partials are stretched sharp. The tolerance `0.04 + 0.005 * n` allows ~4% for the fundamental, growing to ~9% at the 10th harmonic.

#### 3.4.3 Decision with adaptive power factor threshold

```
power_factor = mpm_hpwr / max(wpeak_hpwr, 1e-10)

// Adaptive threshold: relax when MPM has overwhelmingly more harmonic hits
if mpm_hits >= 4 * max(wpeak_hits, 1):
    pf_threshold = 6        // Strong hit dominance — moderate power suffices
else:
    pf_threshold = 8        // Default — require strong power dominance

if mpm_hits >= 3 AND mpm_hits > wpeak_hits AND power_factor > pf_threshold:
    final_freq = mpm_freq    // MPM confirmed by strong harmonic series
elif mpm_hits >= 3 AND mpm_hits == wpeak_hits AND power_factor > pf_threshold:
    final_freq = mpm_freq    // Tied on count, MPM wins on power
else:
    final_freq = w_peak_freq // MPM not convincingly confirmed
```

**Why power_factor thresholds?** A true fundamental's harmonics carry significantly more total energy than coincidental alignments from noise. Real fundamentals show power factors of 13–27+, while noise-based matches show 2–5. The default threshold of 8 cleanly separates genuine from spurious.

**Why the adaptive relaxation to 6?** Some notes produce moderate power ratios (6–8) but overwhelming hit count ratios (e.g. 7 hits vs 1). The 4x hit count requirement (`mpm_hits >= 4 * wpeak_hits`) ensures we only relax the power threshold when harmonic structure is unambiguous. Example: UIowa Db3 has 7 MPM hits vs 1 w_peak hit with power_factor 7.8 — correctly retained with threshold 6.

**Why not always use 6?** Some high notes (e.g. Legacy C8) produce power factors around 6 where MPM has locked onto a wrong frequency but still shows moderate harmonic alignment (5 hits vs 2). The 4x hit requirement prevents these cases from triggering the relaxed threshold (5 < 4×2 = 8, so threshold stays at 8).

### 3.5 Order of evaluation

The decision engine branches are evaluated in this order:

1. **Guard** (§3.1): `w_peak_freq ≤ 1000` or `mpm_freq ≤ 0` → use MPM directly
2. **Large ratio** (§3.4): `closest_int > 8` → harmonic verification
3. **Small ratio, harmonic** (§3.3): `closest_int ≤ 8` and `|ratio - int| < 0.2` → power comparison
4. **Small ratio, non-harmonic**: `closest_int ≤ 8` and `|ratio - int| ≥ 0.2` → use w_peak (MPM on noise)

### 3.6 Why MPM is preferred over FFT spectral peaks for tuning

Piano strings exhibit **inharmonicity**: the upper partials are stretched sharp relative to the ideal harmonic series. This means the spectral peak of the fundamental partial is shifted slightly flat compared to the *perceived pitch*, which corresponds to the periodicity detected by MPM.

For tuning purposes, MPM's time-domain periodicity measurement gives the **perceptually correct pitch**. FFT-based refinement of the fundamental peak was tested and found to be counterproductive — it moved the detected frequency away from the correct tuning target, especially for low notes with high inharmonicity.

### 3.7 Fallback

```
if final_freq < 0 AND w_peak_freq > 0:
    final_freq = w_peak_freq    // MPM totally failed, use spectral peak
```

---

## Complete Decision Flowchart

```
                         ┌──────────────────────┐
                         │ mpm_freq, w_peak_freq │
                         └──────────┬───────────┘
                                    │
                       ┌────────────▼────────────┐
                       │ w_peak > 1000 Hz        │
                       │ AND mpm_freq > 0?       │
                       └───┬─────────────┬───────┘
                          NO            YES
                           │             │
                     Use mpm_freq        │
                           │    ┌────────▼────────┐
                           │    │ ratio = w / m   │
                           │    │ closest_int     │
                           │    └────────┬────────┘
                           │             │
                           │    ┌────────▼──────────┐
                           │    │ closest_int > 8?  │
                           │    └──┬────────────┬───┘
                           │     YES            NO
                           │      │              │
                           │      │     ┌────────▼──────────────┐
                           │      │     │ |ratio - int| < 0.2?  │
                           │      │     └──┬─────────────┬──────┘
                           │      │       NO            YES
                           │      │        │              │
                           │      │   Use w_peak    ┌─────▼──────────┐
                           │      │                 │ Power compare  │
                           │      │                 │ (§3.3.2)       │
                           │      │                 └──┬─────────┬───┘
                           │      │               MPM wins   MPM loses
                           │      │                    │          │
                           │      │              Use mpm_freq  Use w_peak
                           │      │
                           │  ┌───▼─────────────────────┐
                           │  │ Harmonic Verification   │
                           │  │ (§3.4: find peaks,      │
                           │  │  count hits, compare    │
                           │  │  with adaptive pf)      │
                           │  └──┬──────────────┬───────┘
                           │   MPM confirmed   MPM not confirmed
                           │        │                │
                           │   Use mpm_freq     Use w_peak
                           │
                     ┌─────▼─────────────────┐
                     │ final < 0 and w > 0?  │
                     │ → fallback to w_peak  │
                     └───────────────────────┘
```

---

## JS Porting Notes

### Buffer & Sample Rate
- Web Audio `AnalyserNode.getFloatTimeDomainData()` gives float32 buffers
- `AudioContext.sampleRate` gives the SR (commonly 44100 or 48000)
- Use `fftSize = 8192` on the AnalyserNode for the time-domain buffer, but compute the 65536-point FFT yourself

### FFT in JS
- No built-in `rfft`. Options:
  - Use a JS FFT library (e.g. the existing approach in `hps-detector.js` which does manual FFT)
  - Or compute a real FFT via the split-radix algorithm
- The 65536-point FFT is the most expensive part. At 48 kHz with `requestAnimationFrame` (~60 fps), this is feasible but monitor CPU usage
- The Hanning window: `w[i] = 0.5 * (1 - cos(2 * PI * i / (N-1)))`

### Autocorrelation — FFT-based (key optimization)

The single most impactful optimization for JS porting is using FFT-based autocorrelation instead of a direct nested loop. The existing `mcleod-detector.js` uses direct computation which is O(N²). Switching to the FFT method described in §1.3 makes it O(N log N).

**Practical impact:**
| Buffer size | Direct loop | FFT-based | Speedup |
|-------------|-------------|-----------|---------|
| 8192        | ~1 ms       | ~0.3 ms   | ~3x     |
| 16384       | ~4 ms       | ~0.5 ms   | ~8x     |
| 32768       | ~16 ms      | ~1 ms     | ~16x    |
| 65536       | ~65 ms      | ~2 ms     | ~32x    |

At 60 fps, each frame has a ~16ms budget. Direct autocorrelation for buffers ≥32768 would consume the entire frame budget. FFT-based autocorrelation enables large buffers for better low-frequency resolution.

**Implementation in JS:**
```js
function fftAutocorrelation(buffer, maxTau) {
    const N = buffer.length;
    const nFft = nextPowerOf2(2 * N);

    // Forward FFT (use your FFT library)
    const X = rfft(buffer, nFft);   // Complex array, length nFft/2+1

    // Power spectrum: X * conj(X) = |X|²
    // For real FFT output [re, im] pairs:
    for (let i = 0; i < X.length; i++) {
        X[i] = X[i].re * X[i].re + X[i].im * X[i].im;  // Real-only
        // (imaginary part becomes 0)
    }

    // Inverse FFT → autocorrelation
    const rFull = irfft(X, nFft);

    // Return only the lags we need
    return rFull.slice(0, maxTau);
}
```

Note: The same FFT library used for the 65536-point spectral analysis (Stage 2) can be reused here. The autocorrelation FFT is smaller (next power of 2 above 2×N, typically 16384 for N=8192).

### NSDF Normalization in JS

```js
const sq = new Float32Array(N);
for (let i = 0; i < N; i++) sq[i] = buffer[i] * buffer[i];

let sumSq = 0;
for (let i = 0; i < N; i++) sumSq += sq[i];

const cumSq = new Float32Array(N);
cumSq[0] = sq[0];
for (let i = 1; i < N; i++) cumSq[i] = cumSq[i-1] + sq[i];

const m = new Float32Array(maxTau);
m[0] = 2 * sumSq;
for (let tau = 1; tau < maxTau; tau++) {
    m[tau] = (sumSq - cumSq[tau - 1]) + cumSq[N - tau - 1];
}

// NSDF = 2 * acf / m
const nsdf = new Float32Array(maxTau);
for (let tau = 0; tau < maxTau; tau++) {
    nsdf[tau] = m[tau] > 0 ? (2 * acf[tau] / m[tau]) : 0;
}
```

### Existing Codebase Integration
- This detector could extend `PitchDetector` from `pitch-common.js`
- The `get_pitch(buffer, sampleRate)` maps to `getPitch(buffer, sampleRate)` returning Hz or -1
- Parameters (`cutoff`, `small_cutoff`) can be exposed via `getParams()` / `setParam()` for the debug UI sliders
- The decision engine logic is all simple arithmetic — no numpy-specific constructs

### Performance Considerations
- The 65536-point FFT is the bottleneck. Consider:
  - Computing it every other frame instead of every frame
  - Using a smaller FFT (32768) if 1.46 Hz resolution is acceptable
  - Only running Stage 2+3 when MPM reports a frequency > 1000 Hz (skip the FFT for low notes where MPM is reliable)
- The FFT-based autocorrelation (Stage 1) uses a smaller FFT (16384 for 8192-sample buffer) and is cheap
- The harmonic verification (Stage 3.4) only runs when ratio > 8, which is infrequent during normal use

---

## Test Results

Tested across 6 piano datasets covering the full 88-key range at multiple velocities:

| Dataset | Samples tested | Notes | Pass rate |
|---------|---------------|-------|-----------|
| UIowa Piano mf | 86 | A0–C8, single velocity | 86/86 |
| Salamander Grand v8 | 45 | A0–C8, middle velocity | 45/45 |
| Kamoe Piano 301 | 52 | A0–C8, 3 velocities | 50/52 |
| DK Gentle Grand | 30 | A0–C8, RR1 only | 30/30 |
| Legacy Knight 1.0 | 30 | A0–C8, single velocity | 29/30 |
| Steinway Grand | 28 | A0–F6, Dyn2 RR1 only | 28/28 |

**Overall: 269/271 (99.3%)**

### Known failures
- **Kamoe A0 forte** (27.5 Hz): Attack transient at forte dynamics interferes with detection in a short 8192-sample buffer. Works at 16384 samples.
- **Kamoe C1 forte** (32.7 Hz): Borderline — exactly 35 cents off (tolerance ±35c at this frequency).
- **Legacy A0** (27.5 Hz): Extremely weak sample (max amplitude 0.048) — effectively unusable regardless of algorithm.

### Tolerance by frequency range

| Range | Tolerance | Rationale |
|-------|-----------|-----------|
| A0–B0 (< 65.5 Hz) | ±35 cents | High inharmonicity at extreme low end |
| C1–B5 (65.5–988 Hz) | ±25 cents | Standard tuning accuracy |
| C6–B6 (1047–2093 Hz) | ±50 cents | Increasing inharmonicity and decreasing signal |
| C7+ (≥ 2093 Hz) | ±100 cents | Very short periods, weak fundamentals, stretch tuning |

---

## Test Data & Expected Behavior

| Range         | Expected behavior                                                       |
|---------------|-------------------------------------------------------------------------|
| A0–B3 (~27–247 Hz) | MPM dominates. Spectral peak may find overtone but decision engine retains MPM via harmonic verification (§3.4). |
| C4–B5 (~262–988 Hz) | MPM reliable. `w_peak_freq <= 1000` guard keeps MPM result. |
| C6–B6 (~1047–1976 Hz) | Transition zone. Decision engine starts activating. Both candidates usually agree. |
| C7–C8 (~2093–4186 Hz) | MPM often fails (low amplitude, short period vs noise). Spectral peak takes over via power comparison (§3.3). Expect stretch tuning offsets of +20 to +100 cents on real pianos. |

### Known Limitation
- No RMS noise gate. The algorithm assumes the input buffer contains a real note, not silence. In a real-time tuner, gate on RMS before calling this detector.
