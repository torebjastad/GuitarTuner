# Pitch Detection Algorithms

This document describes the three pitch detection algorithms used in the Guitar Tuner application. All are time-domain methods that estimate the fundamental frequency (F0) of a periodic signal.

---

## YIN Algorithm (`YinDetector`)

**Source:** Based on the paper *"YIN, a fundamental frequency estimator for speech and music"* by Alain de Cheveigné and Hideki Kawahara (2002).

### Overview

YIN is a refined autocorrelation-based method that uses a difference function and cumulative mean normalization to reliably detect the fundamental period of a signal. It offers high accuracy, particularly with its built-in octave-error correction step.

### Steps

#### 1. Difference Function

For each candidate period (lag) `tau`, compute the squared difference between the signal and a delayed copy of itself:

```
d(tau) = sum( (x[i] - x[i + tau])^2 )   for i = 0..N/2
```

where `N` is the buffer length. The lag `tau` that corresponds to the true period will produce a minimum in `d(tau)`, since the signal closely matches its shifted copy at that lag.

#### 2. Cumulative Mean Normalized Difference Function (CMND)

Raw difference values tend to favor `tau = 0` (which is always zero). To remove this bias, each value is normalized by the running average of all previous values:

```
d'(tau) = d(tau) / ( (1/tau) * sum(d(j), j=1..tau) )
```

This normalization ensures `d'(0) = 1` and makes the dips at the true period stand out more clearly, reducing octave errors.

#### 3. Absolute Threshold

Scan `d'(tau)` for the first value that falls below a configurable threshold (default: `0.1`). The search begins at `minTau = sampleRate / MAX_FREQUENCY` (to skip impossibly high frequencies) and ends at `maxTau = sampleRate / MIN_FREQUENCY` (capped at `N/2`). Once a dip below the threshold is found, continue walking forward to find the local minimum within that dip. This selects the fundamental period rather than a harmonic.

If no value falls below the threshold, the global minimum of `d'(tau)` is used as a fallback.

#### 4. Octave-Error Correction (Sub-harmonic Check)

Guitar low strings (E2, A2) often have a stronger 2nd harmonic than the fundamental, which can cause YIN to lock onto half the true period. To correct this, the algorithm checks whether a valid dip exists at `2 * tau` (the sub-harmonic / true fundamental period):

1. Compute `doubleTau = round(tau * 2)`.
2. Search a small radius around `doubleTau` (±10% of `tau`, minimum ±4 samples) for the local minimum in the CMND buffer.
3. If that minimum's CMND value is below `0.3` (a relaxed threshold), accept it as the true fundamental and replace `tau` with `bestTau`.

This step significantly improves accuracy on low E and A strings.

#### 5. Sub-sample Interpolation

The selected `tau` is an integer sample index. To get sub-sample accuracy, a **5-point least-squares quadratic fit** is used (falling back to 3-point near buffer edges).

**5-point fit** — fits `y = ax² + bx + c` to `tau-2` through `tau+2` via least squares:

```
a = (2*s_{-2} - s_{-1} - 2*s_0 - s_1 + 2*s_2) / 14
b = (-2*s_{-2} - s_{-1} + s_1 + 2*s_2) / 10
tau_refined = tau - b / (2*a)
```

The 5-point fit is more robust than the traditional 3-point parabolic interpolation because it averages over a wider region, reducing sensitivity to asymmetric or noisy CMND dips (common when harmonics are strong relative to the fundamental).

**3-point fallback** (near buffer edges):

```
adjustment = (s2 - s0) / (2 * (2*s1 - s2 - s0))
tau_refined = tau + adjustment
```

Both fits include a sanity check: the adjustment is rejected if it exceeds the expected range (±2 samples for 5-point, ±1 for 3-point).

#### 6. Confidence Check (Noise Gate)

A probability estimate is derived from the CMND value at the detected lag:

```
probability = 1 - d'(tau)
```

If `probability < 0.6`, the reading is rejected (returns `-1`). This prevents spurious pitch readings during silence or noise.

#### 7. Frequency Conversion

```
frequency = sampleRate / tau_refined
```

### Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `threshold` | `0.1` | CMND threshold for period detection. Lower = stricter. |
| Sub-harmonic threshold | `0.3` | CMND threshold for octave-error correction. Accepts fundamental at `2*tau` if below this. |
| Noise gate | `0.6` | Minimum confidence to accept a reading. |

### Characteristics

- **Accuracy:** High — the CMND normalization greatly reduces octave errors compared to plain autocorrelation.
- **Latency:** Moderate — requires O(N²) operations where N = maxTau (restricted by `MIN_FREQUENCY`, capped at bufferSize / 2).
- **Best for:** General-purpose tuning where accuracy matters more than speed.

---

## Autocorrelation Algorithm (`AutocorrelationDetector`)

**Source:** Classic autocorrelation-based pitch detection, commonly found in early Web Audio API demos.

### Overview

This algorithm computes the autocorrelation of the signal to find repeating patterns. The lag at which the autocorrelation peaks corresponds to the fundamental period. It is simpler and faster than YIN but more prone to octave errors.

### Steps

#### 1. RMS Noise Gate

Compute the root-mean-square amplitude of the buffer:

```
rms = sqrt( sum(x[i]^2) / N )
```

If `rms < 0.01`, the signal is considered silence and the function returns `-1`. This prevents the algorithm from chasing noise.

#### 2. Signal Trimming

The buffer is trimmed from both ends by finding the first sample from each side whose absolute value falls below a threshold of `0.2`. This removes leading/trailing low-amplitude noise and focuses the analysis on the strongest part of the waveform.

```
r1 = first index from start where |x[i]| < 0.2
r2 = first index from end where |x[i]| < 0.2
subBuffer = buffer[r1..r2]
```

#### 3. Autocorrelation

The autocorrelation function is computed for lags up to `maxLag = sampleRate / MIN_FREQUENCY` (capped at the trimmed buffer size):

```
c(lag) = sum( subBuffer[j] * subBuffer[j + lag] )   for j = 0..N-lag
```

At lag 0, this equals the signal's energy. At the lag matching the fundamental period, a strong secondary peak appears.

#### 4. Find First Dip, Then Peak

To avoid selecting lag 0 (which is always the maximum), the algorithm first walks forward from `minLag = sampleRate / MAX_FREQUENCY` past the initial decline — finding the first index `d` where `c[d] > c[d+1]` stops being true (i.e., the autocorrelation stops decreasing).

From that point onward, it searches for the maximum value up to `maxLag`, which corresponds to the fundamental period:

```
T0 = argmax( c[i] )   for i = d..maxLag
```

#### 5. Parabolic Interpolation

As with YIN, a parabola is fit through the three points around the peak to refine the period estimate to sub-sample precision:

```
a = (x1 + x3 - 2*x2) / 2
b = (x3 - x1) / 2
T0_refined = T0 - b / (2*a)
```

#### 6. Frequency Conversion

```
frequency = sampleRate / T0_refined
```

### Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| RMS gate | `0.01` | Minimum RMS amplitude to process. |
| Trim threshold | `0.2` | Amplitude threshold for trimming buffer edges. |

### Characteristics

- **Accuracy:** Moderate — susceptible to octave errors (may lock onto harmonics instead of the fundamental).
- **Latency:** Lower than YIN — simpler computation, though still O(N²). Search range restricted by `MIN_FREQUENCY` / `MAX_FREQUENCY`.
- **Best for:** Situations where speed is preferred over precision, or as a quick alternative for comparison.

---

## McLeod Pitch Method (`McLeodDetector`)

**Source:** Based on the paper *"A Smarter Way to Find Pitch"* by Philip McLeod and Geoff Wyvill (2005), University of Otago. Further detailed in McLeod's PhD thesis *"Fast, Accurate Pitch Detection Tools for Music Analysis"* (2008).

### Overview

The McLeod Pitch Method (MPM) uses a Normalized Square Difference Function (NSDF) to detect pitch. Unlike YIN which finds **minima** in a cumulative mean normalized difference, MPM finds **maxima** in the NSDF, which produces values in the range [-1, +1]. It uses a **relative threshold** (proportional to the highest peak) rather than an absolute one, making it adaptive to signal characteristics. The NSDF value at the selected peak directly serves as a clarity/confidence metric.

### Steps

#### 1. Normalized Square Difference Function (NSDF)

The NSDF is defined as:

```
NSDF(tau) = 2 * r(tau) / m(tau)
```

where:
- `r(tau) = sum(x[i] * x[i + tau])` for `i = 0..N-tau-1` (autocorrelation at lag tau)
- `m(tau) = sum(x[i]^2 + x[i + tau]^2)` for `i = 0..N-tau-1` (normalization term)

The normalization by `m(tau)` ensures NSDF values lie in `[-1, +1]`. A value of `+1` indicates perfect periodicity at that lag, `0` indicates no correlation, and `-1` indicates perfect anti-correlation.

**Intuition:** The NSDF can be understood as a normalized version of the autocorrelation. The factor of 2 in the numerator ensures that `NSDF(0) = 1` (since `r(0) = m(0)/2`). The per-lag normalization (as opposed to YIN's cumulative mean) means each lag is evaluated independently, which avoids the bias toward shorter periods that raw autocorrelation exhibits.

**Relationship to SDF:** The Squared Difference Function `d(tau) = sum((x[i] - x[i+tau])^2)` expands to `m(tau) - 2*r(tau)`. Therefore `NSDF(tau) = 1 - d(tau)/m(tau)`, showing that maxima in the NSDF correspond to minima in the normalized SDF.

#### 2. Peak Picking (Key Maxima)

Rather than searching for a single minimum, MPM identifies all "key maxima" — the highest points in each positive lobe of the NSDF:

1. Walk through the NSDF looking for **positive zero crossings** (where the value goes from ≤ 0 to > 0).
2. Between each positive zero crossing and the next **negative zero crossing** (value goes from > 0 to ≤ 0), find the maximum NSDF value.
3. Store this maximum as a "key maximum" with its tau position and NSDF value.

This produces a small set of candidate periods (typically 5–15), each corresponding to a potential fundamental period or harmonic.

#### 3. Relative Threshold Selection

The key innovation of MPM is its **relative threshold**:

```
threshold = k * nmax
```

where:
- `nmax` = the highest NSDF value among all key maxima
- `k` = cutoff constant (default: `0.93` for musical instruments)

The algorithm then selects the **first key maximum** (smallest tau / highest frequency) whose value is ≥ the threshold. This approach is adaptive: for clear, periodic signals, the threshold is high and only the best matches pass; for noisier signals, the threshold lowers automatically.

**Why the first peak?** The fundamental period produces the smallest tau among peaks with similar NSDF values. Harmonics appear at integer multiples of the fundamental's tau but typically have lower NSDF values. By requiring peaks to be close to the global maximum, harmonics are rejected, and by picking the first qualifying peak, the fundamental is preferred over sub-harmonics.

#### 4. Parabolic Interpolation

A 3-point parabolic fit refines the selected tau to sub-sample precision:

```
a = (s0 + s2 - 2*s1) / 2
b = (s2 - s0) / 2
adjustment = -b / (2*a)
tau_refined = tau + adjustment
```

where `s0`, `s1`, `s2` are the NSDF values at `tau-1`, `tau`, `tau+1`. The fit is only applied when the parabola is concave down (`a < 0`) and the adjustment is within ±1 sample.

#### 5. Clarity Gate

The NSDF value at the selected peak directly indicates signal clarity:

```
clarity = NSDF(selectedTau)
```

Values range from 0 to 1 for positive peaks:
- Near 1.0: very clear, strongly periodic signal
- 0.5–0.8: moderately clear pitch
- Below `smallCutoff` (0.5): rejected as too noisy

If `clarity < smallCutoff`, the reading is rejected (returns `-1`).

#### 6. Frequency Conversion

```
frequency = sampleRate / tau_refined
```

### Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `cutoff` (k) | `0.93` | Relative threshold multiplier. Higher = stricter harmonic rejection. McLeod recommends 0.93 for instruments. |
| `smallCutoff` | `0.5` | Minimum clarity to accept a reading. Below this, signal is considered noise. |

### Characteristics

- **Accuracy:** High — the relative threshold adapts to signal quality and effectively rejects harmonics without requiring octave-correction heuristics.
- **Latency:** Moderate — O(N^2) computation like YIN, where N = buffer length.
- **Octave errors:** Resistant — the "first peak above relative threshold" strategy inherently prefers the fundamental over harmonics. No explicit octave-correction step needed.
- **Clarity metric:** Direct — the NSDF value at the peak is a meaningful confidence measure, unlike YIN where `1 - CMND` is an indirect proxy.
- **Best for:** Musical instrument tuning where adaptive harmonic rejection and a built-in clarity metric are valued. **Default algorithm** in this tuner.

---

## Comparison

| Property | YIN | McLeod (MPM) | Autocorrelation |
|----------|-----|--------------|-----------------|
| Core function | Difference (finds **minima**) | NSDF (finds **maxima**) | Autocorrelation (finds **maxima**) |
| Normalization | Cumulative mean (CMNDF) | Per-lag `m(tau)` (NSDF) | None |
| Threshold type | Absolute (`0.1`) | Relative (`k * nmax`) | None (argmax) |
| Octave error resistance | High (CMND + correction step) | High (relative threshold) | Low |
| Noise rejection | Confidence-based (probability > 0.6) | Clarity-based (NSDF value > 0.5) | RMS threshold (> 0.01) |
| Sub-sample interpolation | Yes (5-point least-squares) | Yes (3-point parabolic) | Yes (3-point parabolic) |
| Computational cost | O(N^2) | O(N^2) | O(N^2) |
| Default in tuner | No | **Yes** | No |
| Explicit octave correction | Yes (sub-harmonic check) | No (not needed) | No |
