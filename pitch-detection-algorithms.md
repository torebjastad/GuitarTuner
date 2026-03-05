# Pitch Detection Algorithms

This document describes the two pitch detection algorithms used in the Guitar Tuner application. Both are time-domain methods that estimate the fundamental frequency (F0) of a periodic signal.

---

## YIN Algorithm (`YinDetector`)

**Source:** Based on the paper *"YIN, a fundamental frequency estimator for speech and music"* by Alain de Cheveigné and Hideki Kawahara (2002).

### Overview

YIN is a refined autocorrelation-based method that uses a difference function and cumulative mean normalization to reliably detect the fundamental period of a signal. It is the default algorithm in this tuner due to its superior accuracy.

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

Scan `d'(tau)` for the first value that falls below a configurable threshold (default: `0.1`). Once a dip below the threshold is found, continue walking forward to find the local minimum within that dip. This selects the fundamental period rather than a harmonic.

If no value falls below the threshold, the global minimum of `d'(tau)` is used as a fallback.

#### 4. Octave-Error Correction (Sub-harmonic Check)

Guitar low strings (E2, A2) often have a stronger 2nd harmonic than the fundamental, which can cause YIN to lock onto half the true period. To correct this, the algorithm checks whether a valid dip exists at `2 * tau` (the sub-harmonic / true fundamental period):

1. Compute `doubleTau = round(tau * 2)`.
2. Search a small radius around `doubleTau` (±10% of `tau`, minimum ±4 samples) for the local minimum in the CMND buffer.
3. If that minimum's CMND value is below `0.3` (a relaxed threshold), accept it as the true fundamental and replace `tau` with `bestTau`.

This step significantly improves accuracy on low E and A strings.

#### 5. Parabolic Interpolation

The selected `tau` is an integer sample index. To get sub-sample accuracy, a parabola is fit through the three points around the minimum (`tau-1`, `tau`, `tau+1`):

```
adjustment = (s2 - s0) / (2 * (2*s1 - s2 - s0))
tau_refined = tau + adjustment
```

This typically improves frequency resolution by an order of magnitude.

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
- **Latency:** Moderate — requires O(N^2) operations where N = bufferSize / 2.
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

The autocorrelation function is computed for all lags over the trimmed buffer:

```
c(lag) = sum( subBuffer[j] * subBuffer[j + lag] )   for j = 0..N-lag
```

At lag 0, this equals the signal's energy. At the lag matching the fundamental period, a strong secondary peak appears.

#### 4. Find First Dip, Then Peak

To avoid selecting lag 0 (which is always the maximum), the algorithm first walks forward past the initial decline — finding the first index `d` where `c[d] > c[d+1]` stops being true (i.e., the autocorrelation stops decreasing).

From that point onward, it searches for the maximum value, which corresponds to the fundamental period:

```
T0 = argmax( c[i] )   for i = d..N
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
- **Latency:** Lower than YIN — simpler computation, though still O(N^2).
- **Best for:** Situations where speed is preferred over precision, or as a quick alternative for comparison.

---

## Comparison

| Property | YIN | Autocorrelation |
|----------|-----|-----------------|
| Octave error resistance | High (CMND normalization) | Low |
| Noise rejection | Confidence-based (probability > 0.6) | RMS threshold (> 0.01) |
| Sub-sample interpolation | Yes (parabolic) | Yes (parabolic) |
| Computational cost | Higher | Lower |
| Default in tuner | Yes | No |
| Configurable threshold | Yes (`0.1`) | No (hardcoded) |
