# Ultimate Piano Detector — Algorithm Reference

Hybrid pitch detection algorithm designed for piano audio. Combines McLeod Pitch Method (time-domain) with a frequency-weighted spectral peak (frequency-domain) to handle the full 88-key range, including the problematic high octaves where MPM fails due to sympathetic resonance and hammer thud energy.

This document describes every step in implementation detail, intended as a porting reference for JavaScript (Web Audio API).

---

## Architecture Overview

```
Input buffer (float32, 8192 samples)
         │
         ├──► Stage 1: McLeod MPM  ──► mpm_freq (or -1)
         │
         └──► Stage 2: Weighted Spectral Peak  ──► w_peak_freq
                        │
                        ▼
              Stage 3: Decision Engine
              (compare mpm_freq vs w_peak_freq)
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

### 1.3 Autocorrelation (ACF)

Compute the full autocorrelation via cross-correlation:

```
r = correlate(buffer, buffer, mode='full')   // length = 2N - 1
center = N - 1
acf[tau] = r[center + tau]   for tau = 0..max_tau-1
```

**JS porting note:** `np.correlate(x, x, mode='full')` produces the same result as computing `r[tau] = sum(x[i] * x[i+tau])` for all valid lags. In JS, you can compute this directly with a loop, or via FFT convolution:

```js
// FFT-based ACF (faster for large N):
// 1. Zero-pad buffer to length 2*N
// 2. FFT, multiply by conjugate, IFFT
// 3. Take first max_tau values
```

### 1.4 Normalizing denominator m(tau)

```
sq[i] = buffer[i]^2
m[0] = 2 * sum(sq)

for tau = 1 to max_tau-1:
    m[tau] = m[tau-1] - sq[N - tau] - sq[tau - 1]
```

This is the running sum of squares that normalizes the NSDF. It decreases as tau increases because fewer samples overlap.

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
    skip to 3.6 (fallback)
```

### 3.2 Ratio analysis

```
ratio = w_peak_freq / mpm_freq
closest_int = round(ratio)
```

If MPM and the spectral peak are harmonically related, the ratio will be close to an integer (1, 2, 3, ...). For example, if MPM locked onto the fundamental and the weighted peak found the 2nd harmonic, ratio ~ 2.0.

### 3.3 Extreme ratio check

```
if closest_int > 8:
    final_freq = w_peak_freq    // MPM locked on mechanical thud / structural noise
    DONE
```

Piano harmonics physically don't exceed ~8x the fundamental with meaningful energy. A ratio > 8 means MPM found something unrelated to the note.

### 3.4 Harmonic relation check

```
is_close_to_int = abs(ratio - closest_int) < 0.2
```

**If NOT close to integer:** MPM locked on noise (not harmonically related to the spectral peak). Use `w_peak_freq`.

**If close to integer:** They are harmonically related. Proceed to power comparison.

### 3.5 Power comparison

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

### 3.6 Fallback

```
if final_freq < 0 AND w_peak_freq > 0:
    final_freq = w_peak_freq    // MPM totally failed, use spectral peak
```

---

## Complete Decision Flowchart

```
                         ┌─────────────┐
                         │ mpm_freq, w_peak_freq │
                         └──────┬──────┘
                                │
                    ┌───────────▼───────────┐
                    │ w_peak > 1000 Hz      │
                    │ AND mpm_freq > 0?     │
                    └───┬───────────┬───────┘
                       NO          YES
                        │           │
                  Use mpm_freq      │
                        │    ┌──────▼──────┐
                        │    │ ratio = w/m  │
                        │    │ closest_int  │
                        │    └──────┬──────┘
                        │           │
                        │    ┌──────▼──────────┐
                        │    │ closest_int > 8? │
                        │    └──┬──────────┬───┘
                        │      YES         NO
                        │       │           │
                        │  Use w_peak  ┌────▼─────────────┐
                        │              │ |ratio - int| < 0.2? │
                        │              └──┬──────────┬────┘
                        │                NO          YES
                        │                 │           │
                        │            Use w_peak  ┌────▼──────────┐
                        │                        │ Power compare │
                        │                        └──┬────────┬──┘
                        │                      MPM wins   MPM loses
                        │                           │          │
                        │                     Use mpm_freq  Use w_peak
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

### Autocorrelation
- Can be computed via FFT convolution (faster for large N):
  ```js
  // Pad to 2*N, FFT, multiply by conjugate, IFFT, take first max_tau values
  ```
- Or direct nested loop (simpler, slower, but fine for 8192 samples at ~60fps)
- The existing `mcleod-detector.js` in the GuitarTuner codebase already has a working MCLeod implementation that can be adapted

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
- The MCLeod autocorrelation loop (`max_tau` iterations) is O(N) and fast
- The `m[tau]` running sum is already the efficient incremental version

---

## Test Data & Expected Behavior

| Range         | Expected behavior                                                       |
|---------------|-------------------------------------------------------------------------|
| A0–B3 (~27–247 Hz) | MPM dominates. Spectral peak may find overtone but decision engine retains MPM. |
| C4–B5 (~262–988 Hz) | MPM reliable. `w_peak_freq <= 1000` guard keeps MPM result. |
| C6–B6 (~1047–1976 Hz) | Transition zone. Decision engine starts activating. Both candidates usually agree. |
| C7–C8 (~2093–4186 Hz) | MPM often fails (low amplitude, short period vs noise). Spectral peak takes over. Expect stretch tuning offsets of +20 to +100 cents on real pianos. |

### Known Limitation
- No RMS noise gate. The algorithm assumes the input buffer contains a real note, not silence. In a real-time tuner, gate on RMS before calling this detector.
