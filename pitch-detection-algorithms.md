# Pitch Detection Algorithms

This document describes the five pitch detection algorithms used in the Guitar Tuner application. Three are time-domain methods, one (HPS) is frequency-domain, and one (MUSIC) is subspace-based.

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

*Note: All algorithms now expose their parameters dynamically via the Tuning UI's "Show Algorithm Debug" section, allowing real-time adjustment of thresholds and gates.*

| Parameter | Default | Description |
|-----------|---------|-------------|
| `threshold` | `0.1` | CMND threshold for period detection. Lower = stricter. |
| Sub-harmonic threshold | `0.3` | CMND threshold for octave-error correction. Accepts fundamental at `2*tau` if below this. |
| `probabilityThreshold` | `0.6` | Minimum confidence to accept a reading. |

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

If `rms < 0.002` (default `rmsThreshold`), the signal is considered silence and the function returns `-1`. This prevents the algorithm from chasing noise.

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

*Note: All algorithms now expose their parameters dynamically via the Tuning UI.*

| Parameter | Default | Description |
|-----------|---------|-------------|
| `rmsThreshold` | `0.002` | Minimum RMS amplitude to process. |
| `trimThreshold` | `0.2` | Amplitude threshold for trimming buffer edges. |

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

*Note: All algorithms now expose their parameters dynamically via the Tuning UI.*

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

## Harmonic Product Spectrum (`HpsDetector`)

**Source:** First described by A. Michael Noll (1969), widely used in speech and music analysis.

### Overview

HPS is a **frequency-domain** method, fundamentally different from the three time-domain algorithms above. It computes the FFT of the signal, then multiplies the magnitude spectrum with downsampled copies of itself. Because harmonics of a periodic signal appear at integer multiples of the fundamental (F0, 2×F0, 3×F0, ...), downsampling by factor *k* aligns the *k*-th harmonic with the fundamental. The product of all downsampled spectra therefore peaks sharply at the fundamental frequency.

### Steps

#### 1. Windowing

A Blackman-Harris 4-term window is applied to the input buffer. It has much lower sidelobes (−92 dB) than a Hanning window (−43 dB), giving cleaner spectral peaks for precise interpolation:

```
w(n) = 0.35875 - 0.48829·cos(2πn/(N-1)) + 0.14128·cos(4πn/(N-1)) - 0.01168·cos(6πn/(N-1))
x_windowed[n] = x[n] * w(n)
```

#### 2. Zero-Padded FFT

The windowed signal is zero-padded to 32768 samples (at 48kHz this gives ~1.46 Hz/bin resolution) and transformed using a radix-2 Cooley-Tukey FFT. Only the first half of the output (positive frequencies) is used.

```
X[k] = FFT(x_windowed, padded to 32768)
mag[k] = |X[k]| = sqrt(Re[k]² + Im[k]²)
```

#### 3. Harmonic Product Spectrum (Log Domain)

Instead of multiplying magnitude spectra directly (which causes overflow), the algorithm sums their logarithms:

```
HPS[k] = log(mag[k]) + log(mag[2k]) + log(mag[3k]) + log(mag[4k]) + log(mag[5k])
```

For a signal with fundamental at bin `k₀`:
- `mag[k₀]` — fundamental (strong)
- `mag[2k₀]` — 2nd harmonic (strong)
- `mag[3k₀]` — 3rd harmonic (moderate)
- etc.

All these contribute to `HPS[k₀]`, making it the dominant peak. At any non-fundamental bin, the downsampled copies don't align with harmonics, so their contribution is just noise.

#### 4. Peak Detection

The algorithm finds the maximum of the HPS in the valid frequency range (`MIN_FREQUENCY` to `MAX_FREQUENCY`).

#### 5. Octave-Error Correction

HPS can occasionally lock onto the octave above the fundamental (especially for low strings with weak fundamentals). The algorithm checks if a valid peak exists near `peakBin / 2`:

- Search a small neighborhood around the half-frequency bin
- If the sub-harmonic's HPS value is within 1.5 (log domain) of the main peak, prefer it
- This corresponds to the sub-harmonic being at least ~22% of the main peak's power

#### 6. Two-Stage DTFT Refinement

The HPS peak identifies the correct harmonic bin but with limited frequency precision (~1.46 Hz per bin). A second stage uses the DTFT (Discrete-Time Fourier Transform) to measure the exact frequency with sub-cent accuracy.

**Stage A — Find the spectral peak:** In the original magnitude spectrum (not the HPS product), find the true peak within ±3 bins of the HPS result.

**Stage B — Assess harmonic quality:** Before refinement, each harmonic's reliability is assessed from the FFT magnitude spectrum by comparing the peak at the expected harmonic bin to the local noise floor (average of bins 3–5 positions away). The weight for each harmonic is `max(0, localSNR - 1.5)`. Harmonics buried in noise get weight ≈0 and are excluded, preventing corrupted harmonics from pulling the estimate. The fundamental always gets at least weight 1.

**Stage C — SNR-weighted multi-harmonic DTFT refinement:** Evaluate a weighted multi-harmonic score at arbitrary sub-bin frequencies:

```
S(f) = w₁·|DTFT(f)|² + w₂·|DTFT(2f)|²
```

Uses 2 harmonics (fundamental + 2nd) for refinement. The 3rd harmonic is excluded because guitar string inharmonicity (fₖ = k·f₀·√(1 + B·k²)) causes higher partials to deviate sharp, biasing the result especially on hard attacks.

This combined score is sharper and more stable than the fundamental alone. Uses two rounds of least-squares parabolic fitting (7+5 points) for ~0.005 bin accuracy. At 32768 FFT / 48kHz: **0.007 Hz ≈ 0.1 cent at E2**.

#### 7. SNR Noise Gate

The peak must be significantly above the noise floor (measured as the median HPS value). In log domain, a difference of ≥4 means the peak is exp(4) ≈ 55× stronger than median noise.

### Parameters

*Note: All algorithms now expose their parameters dynamically via the Tuning UI.*

| Parameter | Default | Purpose |
|-----------|---------|-------------|
| `numHarmonics` | `5` | HPS downsampling factors for harmonic identification. |
| `fftSize` | `32768` | Zero-padded FFT. Gives ~1.46 Hz/bin for HPS. |
| `dtftHarmonics` | `2` | Harmonics in DTFT refinement (f and 2f only, to avoid inharmonicity bias). |
| Harmonic weighting | SNR-adaptive | Each harmonic weighted by its local SNR; noisy harmonics excluded automatically. |
| Window | Blackman-Harris 4-term | −92 dB sidelobes for clean spectral peaks. |
| `snrThreshold` | `4` | Minimum log-domain SNR (peak vs median). |
| `rmsThreshold` | `0.002` | Same RMS noise gate as Autocorrelation. |

### Characteristics

- **Accuracy:** Very high — SNR-weighted multi-harmonic DTFT refinement gives ~0.007 Hz effective resolution (~0.1 cent at E2).
- **Latency:** Low — O(N log N) for FFT + O(H·N·P) for DTFT refinement. Total typically < 1 ms.
- **Stability:** High — 7-point least-squares fit averages out noise; adaptive harmonic weighting excludes corrupted partials automatically.
- **Octave errors:** Moderate — mitigated by sub-harmonic check.
- **Best for:** High-accuracy pitch detection with lower computational cost than time-domain methods.

---

## MUSIC Algorithm (`MusicDetector`)

**Source:** Based on the MUSIC (MUltiple SIgnal Classification) algorithm by R. O. Schmidt (1986). Originally developed for direction-of-arrival estimation in antenna arrays, it is equally applicable to frequency estimation of sinusoidal signals.

### Overview

MUSIC is a **subspace-based** method that performs eigenvalue decomposition of the signal's autocorrelation matrix — mathematically the same operation as Principal Component Analysis (PCA). It separates the signal into a "signal subspace" (containing the fundamental and harmonics) and a "noise subspace", then scans a pseudospectrum to find frequencies whose steering vectors are orthogonal to the noise subspace. This produces sharp peaks with "super-resolution" — the ability to resolve frequencies below the FFT bin spacing.

### Relationship to PCA

PCA decomposes a data matrix into principal components by finding the eigenvectors of the covariance matrix. MUSIC does exactly the same operation on the signal's autocorrelation matrix (which IS the covariance matrix for a zero-mean signal). The key insight is that for a signal containing sinusoids in noise:

- The **largest eigenvalues** correspond to sinusoidal components (fundamental + harmonics) — the signal subspace
- The **smallest eigenvalues** cluster near the noise variance — the noise subspace
- The boundary between these subspaces reveals how many sinusoidal components are present

### Steps

#### 1. RMS Noise Gate

Same as the other detectors — reject silent/near-silent buffers:

```
rms = sqrt( sum(x[i]^2) / N )
if rms < 0.002: return -1  (default rmsThreshold)
```

#### 2. Signal Decimation (Anti-Alias Filter + Downsample)

At the native sample rate of 48 kHz, M=96 autocorrelation lags cover only ~2 ms — far too short to resolve E2's ~12 ms period. The steering vectors for low frequencies barely rotate in the complex plane, making them indistinguishable from noise.

To solve this, the signal is decimated by a factor D=6 before processing:

1. **Anti-alias filter:** A windowed-sinc low-pass FIR filter (Hamming window, length 4D+1=25 taps, cutoff at 0.8/D of Nyquist) removes energy above the decimated Nyquist frequency. This provides ~43 dB sidelobe suppression, preventing aliased harmonics from corrupting the autocorrelation.

2. **Downsample:** Every D-th filtered sample is kept, reducing the effective sample rate to 8 kHz.

With decimation, M=96 lags now cover ~12 ms — a full period of E2 (82 Hz), giving sufficient phase rotation for all guitar frequencies.

#### 3. Autocorrelation Matrix Construction

Compute M autocorrelation values from the **decimated** buffer:

```
r(k) = (1/N_d) * sum( x_d[n] * x_d[n+k] )   for k = 0..M-1
```

where x_d is the decimated signal and N_d is its length. Build the M×M symmetric Toeplitz autocorrelation matrix:

```
R[i,j] = r(|i-j|)
```

The model order M (default: 96) controls the trade-off between frequency resolution and computational cost. The matrix is real and symmetric, with Toeplitz structure (constant along each diagonal).

#### 4. Eigenvalue Decomposition (The "PCA Step")

The Jacobi eigenvalue algorithm iteratively diagonalizes R via 2×2 rotations:

1. Sweep through all off-diagonal pairs (p, q) with p < q
2. For each pair where |R[p,q]| exceeds a threshold, compute a rotation angle that zeros out R[p,q]
3. Apply the rotation to R and accumulate it in the eigenvector matrix V
4. Repeat sweeps until all off-diagonal elements are below epsilon (typically 6–10 sweeps)

This produces eigenvalues (diagonal of the rotated R) and eigenvectors (columns of V). Uses Float64Array for numerical stability.

#### 5. Subspace Separation

Sort eigenvalues in descending order and find the signal/noise boundary via eigenvalue gap detection:

```
ratio[i] = eigenvalue[i] / eigenvalue[i+1]
p = argmax(ratio[i])   for i in [2, 20]
```

The largest ratio indicates where signal eigenvalues end and noise eigenvalues begin. If no gap exceeds 2×, the signal quality is too poor and the reading is rejected.

- Signal subspace: eigenvectors for the p largest eigenvalues
- Noise subspace: eigenvectors for the remaining M−p eigenvalues

#### 6. MUSIC Pseudospectrum Scan

For a candidate frequency f, the MUSIC pseudospectrum is:

```
P(f) = 1 / sum_k |<e_k, a(f)>|²
```

where e_k are noise eigenvectors and a(f) is the steering vector using the **effective** (decimated) sample rate fs_eff = fs/D:

```
a(f) = [1, e^(j·2π·f/fs_eff), e^(j·4π·f/fs_eff), ..., e^(j·2π·(M-1)·f/fs_eff)]
```

Frequencies present in the signal have steering vectors orthogonal to the noise subspace, making the denominator near-zero and P(f) very large — producing sharp peaks. The scan frequency range is clamped to below 95% of the decimated Nyquist (0.95 × fs_eff/2 = 3800 Hz).

The scan uses a two-stage approach:

- **Coarse:** 500 logarithmically-spaced frequencies from MIN_FREQUENCY to max scan frequency
- **Fine:** ±3% of center frequency (minimum ±5 Hz) at 0.1 Hz steps around each of the top 15 peaks, with parabolic refinement

#### 7. Fundamental Identification (Score-Gated Harmonic Validation)

The pseudospectrum shows peaks at the fundamental and all harmonics. To identify the fundamental:

1. **Score gating:** Compute a minimum score threshold (1% of the strongest peak's score). Peaks below this threshold are excluded from harmonic validation, preventing noise peaks from accidentally matching harmonic intervals.
2. Sort above-threshold peaks by frequency ascending.
3. For each candidate (lowest first), check if other above-threshold peaks exist at 2f, 3f, 4f, 5f, 6f (within 4% tolerance).
4. The first candidate with 2+ confirmed harmonics is identified as the fundamental.
5. **Sub-harmonic check:** For candidates with 1+ harmonics, probe the pseudospectrum at f/2. Accept f/2 as fundamental only if its score ≥ the candidate's score AND at least 2 detected peaks are harmonics of f/2.
6. Fallback: candidate with the most harmonics, or the highest-scoring peak overall.

### Configuration

*Note: All algorithms now expose their parameters dynamically via the Tuning UI.*

| Parameter | Default | Description |
|-----------|---------|-------------|
| Model order `M` | `96` | Size of the autocorrelation matrix. Controls resolution vs. cost. |
| Decimation factor `D` | `6` | Downsample ratio. Reduces effective sample rate from 48kHz to 8kHz. |
| Anti-alias filter | Windowed-sinc (25 taps) | Hamming-windowed FIR, cutoff at 0.8/D of Nyquist (~3200 Hz). |
| Max Jacobi sweeps | `15` | Maximum iterations for eigendecomposition. Typically converges in 4–6. |
| Signal dimension p | Adaptive (2–20) | Estimated via eigenvalue gap detection. |
| `eigenvalueGapThreshold` | `2.0` | Minimum ratio for signal/noise boundary. |
| Coarse scan points | `500` | Log-spaced frequencies for initial pseudospectrum scan. |
| Fine scan range | `±3%` (min ±5 Hz) | Frequency-adaptive range for refinement scan around peaks. |
| Fine scan step | `0.1 Hz` | Resolution of refinement scan. |
| Score gate threshold | `1%` of max | Minimum pseudospectrum score for harmonic validation candidates. |
| Harmonic tolerance | `4%` | Frequency tolerance for harmonic validation. |
| `rmsThreshold` | `0.002` | Minimal signal gate. |

### Characteristics

- **Accuracy:** High — super-resolution property can resolve frequencies below FFT bin spacing.
- **Latency:** Higher — O(M³) for eigendecomposition + O(P·M·(M−p)) for pseudospectrum scan. Typically 4–8 ms per frame.
- **Octave errors:** Low — harmonic validation explicitly identifies the fundamental among all detected sinusoidal components.
- **Noise rejection:** Inherent — the eigendecomposition explicitly separates signal from noise. The eigenvalue gap threshold acts as a signal quality gate.
- **Best for:** Exploring subspace/PCA-based signal analysis. Higher CPU cost than other algorithms.

### Debug Visualization

The debug display shows two panels:
- **Upper panel:** Eigenvalue spectrum (bar chart, log scale). Orange bars = signal subspace, gray bars = noise subspace, with a dashed boundary line.
- **Lower panel:** MUSIC pseudospectrum (dB scale) with detected peaks (red dots) and the identified fundamental (green triangle).

---

## Comparison

| Property | YIN | McLeod (MPM) | Autocorrelation | HPS | MUSIC |
|----------|-----|--------------|-----------------|-----|-------|
| Domain | Time | Time | Time | Frequency | Subspace |
| Core function | Difference (finds **minima**) | NSDF (finds **maxima**) | Autocorrelation (finds **maxima**) | HPS + multi-harmonic DTFT refinement | Eigendecomposition + pseudospectrum |
| Normalization | Cumulative mean (CMNDF) | Per-lag `m(tau)` (NSDF) | None | Log-domain sum + least-squares | Autocorrelation matrix decomposition |
| Threshold type | Absolute (`0.1`) | Relative (`k * nmax`) | None (argmax) | SNR vs median | Eigenvalue gap ratio |
| Octave error resistance | High (CMND + correction step) | High (relative threshold) | Low | Moderate (sub-harmonic check) | High (harmonic validation) |
| Noise rejection | Confidence-based (probability > 0.6) | Clarity-based (NSDF value > 0.5) | RMS threshold (> 0.002) | RMS + SNR gate + adaptive harmonic weighting | RMS + eigenvalue gap + subspace separation |
| Sub-sample interpolation | Yes (5-point least-squares) | Yes (3-point parabolic) | Yes (3-point parabolic) | Yes (SNR-weighted multi-harmonic DTFT, 7+5 point LS) | Yes (fine scan + parabolic) |
| Computational cost | O(N²) | O(N²) | O(N²) | O(N log N) + O(H·N·P) | O(M³) + O(P·M·(M−p)) |
| Default in tuner | No | **Yes** | No | No | No |
| Explicit octave correction | Yes (sub-harmonic check) | No (not needed) | No | Yes (half-frequency check) | Yes (harmonic validation) |
