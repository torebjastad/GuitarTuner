/**
 * MUSIC (MUltiple SIgnal Classification) Pitch Detection
 * Subspace-based frequency estimation using eigendecomposition of the
 * signal's autocorrelation matrix — mathematically the same operation as PCA.
 *
 * The algorithm separates the signal into "signal subspace" (fundamental +
 * harmonics) and "noise subspace" via eigenvalue decomposition, then finds
 * frequencies whose steering vectors are orthogonal to the noise subspace,
 * producing sharp peaks in a "pseudospectrum" with super-resolution accuracy.
 *
 * Steps:
 *   0. Decimate signal (anti-alias filter + downsample by factor D)
 *   1. Compute autocorrelation r(0)..r(M-1) from the decimated buffer
 *   2. Build M×M symmetric Toeplitz matrix R where R[i,j] = r(|i-j|)
 *   3. Jacobi eigendecomposition → eigenvalues + eigenvectors
 *   4. Separate signal subspace (large eigenvalues) from noise subspace
 *   5. Scan MUSIC pseudospectrum P(f) = 1/||E_noise^H · a(f)||²
 *   6. Identify fundamental via harmonic validation with sub-harmonic checking
 *
 * Key design choice: At 48kHz with M=96, the autocorrelation matrix only
 * captures ~2ms of lag — far too short to resolve E2's ~12ms period.
 * Downsampling by D=6 (48kHz→8kHz) gives M=96 coverage over ~12ms,
 * providing sufficient phase rotation for all guitar frequencies while
 * keeping the eigendecomposition cost tractable (O(M³) with M=96).
 *
 * Depends on: pitch-common.js (TunerDefaults, PitchDetector)
 */
class MusicDetector extends PitchDetector {
    constructor(modelOrder = 96, decimationFactor = 6) {
        super();
        this.M = modelOrder;
        this.D = decimationFactor;
        this.debug = false;
        this.debugData = null;

        // Preallocate reusable buffers for eigendecomposition
        this._autocorr = new Float64Array(modelOrder);
        this._R = new Float64Array(modelOrder * modelOrder);
        this._V = new Float64Array(modelOrder * modelOrder);
        this._eigenvalues = new Float64Array(modelOrder);
        this._sortedIndices = new Uint16Array(modelOrder);
        this._steeringRe = new Float64Array(modelOrder);
        this._steeringIm = new Float64Array(modelOrder);

        // Preallocate decimation buffer — sized for max expected input
        // FFTSIZE=4096, decimated by 6 → ~683 samples
        this._decimatedBuffer = new Float64Array(Math.ceil(4096 / decimationFactor) + 1);

        // Build low-pass FIR filter for anti-aliasing
        this._filterCoeffs = this._designLowPassFilter(decimationFactor);
        this._filterLen = this._filterCoeffs.length;
    }

    /**
     * Design a simple windowed-sinc low-pass FIR filter for anti-aliasing.
     * Cutoff at 0.8 * (fs/2D) to leave margin before Nyquist of decimated rate.
     * Uses a Hamming window for -43 dB sidelobe suppression.
     */
    _designLowPassFilter(D) {
        // Filter length: 4*D + 1 (odd, for symmetric filter)
        const L = 4 * D + 1;
        const mid = (L - 1) / 2;
        // Normalized cutoff: 0.8 / D (relative to fs/2)
        const fc = 0.8 / D;
        const coeffs = new Float64Array(L);
        let sum = 0;

        for (let n = 0; n < L; n++) {
            const x = n - mid;
            // Sinc
            let h;
            if (Math.abs(x) < 1e-10) {
                h = 2 * fc;
            } else {
                h = Math.sin(2 * Math.PI * fc * x) / (Math.PI * x);
            }
            // Hamming window
            const w = 0.54 - 0.46 * Math.cos(2 * Math.PI * n / (L - 1));
            coeffs[n] = h * w;
            sum += coeffs[n];
        }

        // Normalize to unity gain at DC
        for (let n = 0; n < L; n++) {
            coeffs[n] /= sum;
        }

        return coeffs;
    }

    /**
     * Anti-alias filter + downsampling.
     * Applies a windowed-sinc low-pass FIR filter, then picks every D-th sample.
     * The FIR filter provides much better stopband attenuation than a box filter,
     * preventing aliasing of upper harmonics into the decimated spectrum.
     *
     * Returns the number of valid samples in the decimated buffer.
     */
    _decimateBuffer(buffer) {
        const N = buffer.length;
        const D = this.D;
        const coeffs = this._filterCoeffs;
        const fLen = this._filterLen;
        const mid = (fLen - 1) / 2;

        // Output length: how many D-spaced samples we can produce after filter delay
        const outLen = Math.floor((N - fLen) / D) + 1;

        // Ensure buffer is large enough
        if (this._decimatedBuffer.length < outLen) {
            this._decimatedBuffer = new Float64Array(outLen);
        }

        // Apply FIR filter at every D-th output position
        for (let i = 0; i < outLen; i++) {
            const center = mid + i * D; // center of filter window in input buffer
            let sum = 0;
            for (let k = 0; k < fLen; k++) {
                sum += buffer[center - mid + k] * coeffs[k];
            }
            this._decimatedBuffer[i] = sum;
        }

        return outLen;
    }

    /**
     * Compute autocorrelation values r(0) through r(M-1) from decimated buffer.
     * Unbiased estimator: r(k) = (1/N) * Σ x[n]·x[n+k]
     */
    _computeAutocorrelation(decimatedLen) {
        const M = this.M;
        const buf = this._decimatedBuffer;
        const r = this._autocorr;
        const N = decimatedLen;

        for (let k = 0; k < M; k++) {
            let sum = 0;
            const limit = N - k;
            for (let n = 0; n < limit; n++) {
                sum += buf[n] * buf[n + k];
            }
            r[k] = sum / N;
        }
    }

    /**
     * Build M×M symmetric Toeplitz autocorrelation matrix.
     * R[i,j] = r(|i-j|), stored as flat array indexed R[i*M + j].
     */
    _buildToeplitzMatrix() {
        const M = this.M;
        const r = this._autocorr;
        const R = this._R;

        for (let i = 0; i < M; i++) {
            for (let j = i; j < M; j++) {
                const val = r[j - i];
                R[i * M + j] = val;
                R[j * M + i] = val;
            }
        }
    }

    /**
     * Cyclic Jacobi eigenvalue algorithm for real symmetric matrices.
     * Iteratively applies 2×2 rotations to diagonalize R.
     *
     * Returns the number of sweeps used, or -1 if not converged.
     * After completion, this._eigenvalues contains eigenvalues and
     * this._V contains eigenvectors as columns.
     */
    _jacobiEigen(maxSweeps = 15) {
        const M = this.M;
        const R = this._R;
        const V = this._V;
        const eps = 1e-10;

        // Initialize V = identity
        V.fill(0);
        for (let i = 0; i < M; i++) {
            V[i * M + i] = 1;
        }

        for (let sweep = 0; sweep < maxSweeps; sweep++) {
            // Compute off-diagonal norm to check convergence
            let offNorm = 0;
            for (let p = 0; p < M; p++) {
                for (let q = p + 1; q < M; q++) {
                    offNorm += R[p * M + q] * R[p * M + q];
                }
            }
            if (offNorm < eps) {
                // Extract eigenvalues from diagonal
                for (let i = 0; i < M; i++) {
                    this._eigenvalues[i] = R[i * M + i];
                }
                return sweep + 1;
            }

            const threshold = Math.sqrt(offNorm) / (M * M);

            // Cyclic sweep through all upper-triangle pairs
            for (let p = 0; p < M - 1; p++) {
                for (let q = p + 1; q < M; q++) {
                    const Rpq = R[p * M + q];
                    if (Math.abs(Rpq) < threshold) continue;

                    const Rpp = R[p * M + p];
                    const Rqq = R[q * M + q];
                    const diff = Rqq - Rpp;

                    let t; // tan(theta)
                    if (Math.abs(Rpq) < eps * Math.abs(diff)) {
                        t = Rpq / diff;
                    } else {
                        const phi = diff / (2 * Rpq);
                        t = 1 / (Math.abs(phi) + Math.sqrt(phi * phi + 1));
                        if (phi < 0) t = -t;
                    }

                    const c = 1 / Math.sqrt(1 + t * t); // cos
                    const s = t * c;                      // sin
                    const tau = s / (1 + c);              // for stable update

                    // Update R matrix — only rows/cols p and q change
                    R[p * M + p] -= t * Rpq;
                    R[q * M + q] += t * Rpq;
                    R[p * M + q] = 0;
                    R[q * M + p] = 0;

                    for (let i = 0; i < M; i++) {
                        if (i === p || i === q) continue;
                        const rip = R[i * M + p];
                        const riq = R[i * M + q];
                        R[i * M + p] = rip - s * (riq + tau * rip);
                        R[p * M + i] = R[i * M + p];
                        R[i * M + q] = riq + s * (rip - tau * riq);
                        R[q * M + i] = R[i * M + q];
                    }

                    // Update eigenvector matrix V
                    for (let i = 0; i < M; i++) {
                        const vip = V[i * M + p];
                        const viq = V[i * M + q];
                        V[i * M + p] = vip - s * (viq + tau * vip);
                        V[i * M + q] = viq + s * (vip - tau * viq);
                    }
                }
            }
        }

        // Did not converge — extract eigenvalues anyway
        for (let i = 0; i < M; i++) {
            this._eigenvalues[i] = R[i * M + i];
        }
        return -1;
    }

    /**
     * Estimate signal subspace dimension via eigenvalue gap detection.
     * Sorts eigenvalues descending, finds the largest ratio between
     * consecutive eigenvalues. Returns p (signal dimension) or -1.
     */
    _estimateSignalDimension() {
        const M = this.M;
        const eigs = this._eigenvalues;
        const indices = this._sortedIndices;

        // Sort indices by eigenvalue descending
        for (let i = 0; i < M; i++) indices[i] = i;
        indices.sort((a, b) => eigs[b] - eigs[a]);

        // Find largest ratio gap in range [2, 20]
        let bestGap = 0;
        let bestP = -1;
        for (let i = 1; i < Math.min(20, M - 1); i++) {
            const upper = eigs[indices[i - 1]];
            const lower = eigs[indices[i]];
            if (lower <= 0) continue;
            const ratio = upper / lower;
            if (ratio > bestGap && i >= 2) {
                bestGap = ratio;
                bestP = i;
            }
        }

        // Require a meaningful gap
        if (bestGap < 2.0) return -1;

        return bestP;
    }

    /**
     * Evaluate MUSIC pseudospectrum at a single frequency.
     * P(f) = 1 / Σ_k |<e_k, a(f)>|² for noise eigenvectors e_k
     *
     * Uses effectiveSampleRate (= sampleRate / D) for steering vector
     * phase computation, since the autocorrelation matrix was built from
     * the decimated signal.
     */
    _computePseudospectrum(freq, effectiveSampleRate, signalDim) {
        const M = this.M;
        const V = this._V;
        const indices = this._sortedIndices;
        const aRe = this._steeringRe;
        const aIm = this._steeringIm;

        // Build steering vector a(f) using effective (decimated) sample rate
        const omega = 2 * Math.PI * freq / effectiveSampleRate;
        for (let m = 0; m < M; m++) {
            const angle = omega * m;
            aRe[m] = Math.cos(angle);
            aIm[m] = Math.sin(angle);
        }

        // Project onto noise subspace (eigenvectors at indices[signalDim..M-1])
        let projSum = 0;
        for (let k = signalDim; k < M; k++) {
            const eigIdx = indices[k];
            let dotRe = 0, dotIm = 0;
            for (let m = 0; m < M; m++) {
                const v = V[m * M + eigIdx];
                dotRe += v * aRe[m];
                dotIm += v * aIm[m];
            }
            projSum += dotRe * dotRe + dotIm * dotIm;
        }

        return projSum > 0 ? 1 / projSum : 0;
    }

    /**
     * Two-stage pseudospectrum scan.
     * Stage 1: ~500 log-spaced frequencies for coarse peak finding
     * Stage 2: Fine scan with frequency-adaptive range + parabolic refinement
     *
     * The scan uses effectiveSampleRate for steering vectors.
     * Frequencies are clamped to below Nyquist of the decimated rate.
     */
    _scanPseudospectrum(effectiveSampleRate, signalDim) {
        const minF = TunerDefaults.MIN_FREQUENCY;
        // Clamp max scan frequency to below Nyquist of decimated signal
        const nyquist = effectiveSampleRate / 2;
        const maxF = Math.min(TunerDefaults.MAX_FREQUENCY, nyquist * 0.95);
        const logMin = Math.log(minF);
        const logMax = Math.log(maxF);
        const numCoarse = 500;

        // Stage 1: Coarse log-spaced scan
        const coarseFreqs = new Float64Array(numCoarse);
        const coarseScores = new Float64Array(numCoarse);

        for (let i = 0; i < numCoarse; i++) {
            const f = Math.exp(logMin + (logMax - logMin) * i / (numCoarse - 1));
            coarseFreqs[i] = f;
            coarseScores[i] = this._computePseudospectrum(f, effectiveSampleRate, signalDim);
        }

        // Find local maxima in coarse scan
        const peaks = [];
        for (let i = 1; i < numCoarse - 1; i++) {
            if (coarseScores[i] > coarseScores[i - 1] &&
                coarseScores[i] > coarseScores[i + 1]) {
                peaks.push({ freq: coarseFreqs[i], score: coarseScores[i] });
            }
        }

        if (peaks.length === 0) {
            // Fallback: find global maximum
            let best = 0;
            for (let i = 1; i < numCoarse; i++) {
                if (coarseScores[i] > coarseScores[best]) best = i;
            }
            peaks.push({ freq: coarseFreqs[best], score: coarseScores[best] });
        }

        // Sort by score descending, keep top 15
        peaks.sort((a, b) => b.score - a.score);
        const topPeaks = peaks.slice(0, 15);

        // Stage 2: Fine scan around each peak
        // Use frequency-adaptive range: ±3% of center frequency (wider at low f)
        for (let p = 0; p < topPeaks.length; p++) {
            const centerF = topPeaks[p].freq;
            const scanRange = Math.max(5, centerF * 0.03); // at least ±5 Hz, or ±3%
            const fLo = Math.max(minF, centerF - scanRange);
            const fHi = Math.min(maxF, centerF + scanRange);
            const step = 0.1;

            let bestF = centerF;
            let bestScore = topPeaks[p].score;

            for (let f = fLo; f <= fHi; f += step) {
                const s = this._computePseudospectrum(f, effectiveSampleRate, signalDim);
                if (s > bestScore) {
                    bestScore = s;
                    bestF = f;
                }
            }

            // Parabolic refinement around bestF
            const sLeft = this._computePseudospectrum(bestF - step, effectiveSampleRate, signalDim);
            const sCenter = bestScore;
            const sRight = this._computePseudospectrum(bestF + step, effectiveSampleRate, signalDim);
            const denom = sLeft - 2 * sCenter + sRight;
            if (denom < 0) {
                const adj = 0.5 * (sLeft - sRight) / denom;
                if (Math.abs(adj) < 1) {
                    bestF += adj * step;
                }
            }

            topPeaks[p].freq = bestF;
            topPeaks[p].score = bestScore;
        }

        return topPeaks;
    }

    /**
     * Identify the fundamental frequency from detected peaks.
     * Uses harmonic validation with score-gated candidate filtering.
     *
     * Strategy:
     *  1. Compute a minimum score threshold (1% of strongest peak) to filter
     *     out noise peaks that happen to align at harmonic intervals.
     *  2. For each above-threshold candidate, count harmonics among other
     *     above-threshold peaks.
     *  3. The lowest candidate with 2+ confirmed harmonics wins.
     *  4. Conservative sub-harmonic check for candidates with fewer harmonics.
     *  5. Fallback: highest-scoring peak.
     */
    _findFundamental(peaks, effectiveSampleRate, signalDim) {
        if (peaks.length === 0) return -1;
        if (peaks.length === 1) return peaks[0].freq;

        // Find the maximum score to set a relative threshold
        let maxScore = 0;
        for (let i = 0; i < peaks.length; i++) {
            if (peaks[i].score > maxScore) maxScore = peaks[i].score;
        }
        // Candidates must have at least 1% of the strongest peak's score
        const minScore = maxScore * 0.01;

        // Sort by frequency ascending, filtering out sub-threshold peaks
        const sorted = [...peaks]
            .filter(p => p.score >= minScore)
            .sort((a, b) => a.freq - b.freq);

        if (sorted.length === 0) {
            // All peaks below threshold — return strongest
            let best = peaks[0];
            for (let i = 1; i < peaks.length; i++) {
                if (peaks[i].score > best.score) best = peaks[i];
            }
            return best.freq;
        }

        // Score each candidate by harmonic support (only counting above-threshold harmonics)
        const candidates = [];

        for (let i = 0; i < sorted.length; i++) {
            const candidate = sorted[i];
            let harmonicCount = 0;

            // Check for harmonics at 2f, 3f, 4f, 5f, 6f
            for (let h = 2; h <= 6; h++) {
                const expectedFreq = candidate.freq * h;
                for (let j = 0; j < sorted.length; j++) {
                    if (j === i) continue;
                    const ratio = Math.abs(sorted[j].freq - expectedFreq) / expectedFreq;
                    if (ratio < 0.04) { // 4% tolerance
                        harmonicCount++;
                        break;
                    }
                }
            }

            candidates.push({
                freq: candidate.freq,
                score: candidate.score,
                harmonicCount: harmonicCount
            });
        }

        // First pass: find the lowest candidate with 2+ harmonics confirmed
        for (let i = 0; i < candidates.length; i++) {
            if (candidates[i].harmonicCount >= 2) {
                return candidates[i].freq;
            }
        }

        // Second pass: conservative sub-harmonic checking
        // Only for candidates with 1+ harmonics, check if f/2 is a stronger
        // peak in the pseudospectrum. This helps with low strings where the
        // fundamental is weak but the 2nd harmonic is strong.
        if (effectiveSampleRate && signalDim !== undefined) {
            const withHarmonics = candidates.filter(c => c.harmonicCount >= 1);
            withHarmonics.sort((a, b) => b.harmonicCount - a.harmonicCount || b.score - a.score);

            for (const cand of withHarmonics) {
                const subF = cand.freq / 2;
                if (subF < TunerDefaults.MIN_FREQUENCY) continue;

                // Probe pseudospectrum at subF with a fine scan
                let bestSubScore = 0;
                let bestSubF = subF;
                for (let df = -3; df <= 3; df += 0.2) {
                    const probeF = subF + df;
                    if (probeF < TunerDefaults.MIN_FREQUENCY) continue;
                    const s = this._computePseudospectrum(probeF, effectiveSampleRate, signalDim);
                    if (s > bestSubScore) {
                        bestSubScore = s;
                        bestSubF = probeF;
                    }
                }

                // Only accept sub-harmonic if:
                // 1) Its score is >= the candidate's score (strong real peak)
                // 2) At least 2 detected peaks are harmonics of the sub-harmonic
                if (bestSubScore >= cand.score) {
                    let subHarmonics = 0;
                    for (let j = 0; j < sorted.length; j++) {
                        for (let h = 2; h <= 8; h++) {
                            const expected = bestSubF * h;
                            const ratio = Math.abs(sorted[j].freq - expected) / expected;
                            if (ratio < 0.04) {
                                subHarmonics++;
                                break;
                            }
                        }
                    }
                    if (subHarmonics >= 2) {
                        return bestSubF;
                    }
                }
            }
        }

        // Third pass: candidate with most harmonics
        let bestCandidate = null;
        let bestHarmonics = -1;
        for (let i = 0; i < candidates.length; i++) {
            if (candidates[i].harmonicCount > bestHarmonics) {
                bestHarmonics = candidates[i].harmonicCount;
                bestCandidate = candidates[i];
            }
        }
        if (bestCandidate && bestHarmonics >= 1) {
            return bestCandidate.freq;
        }

        // Last resort: highest-scoring peak overall
        let best = peaks[0];
        for (let i = 1; i < peaks.length; i++) {
            if (peaks[i].score > best.score) best = peaks[i];
        }
        return best.freq;
    }

    getPitch(buffer, sampleRate) {
        const N = buffer.length;

        // RMS noise gate — very low floor to reject only true silence
        let rms = 0;
        for (let i = 0; i < N; i++) {
            rms += buffer[i] * buffer[i];
        }
        rms = Math.sqrt(rms / N);
        if (rms < 0.002) {
            if (this.debug) this.debugData = null;
            return -1;
        }

        // Normalize buffer to target RMS for amplitude-invariant processing.
        // This allows the algorithm to work on quiet signals (decaying notes)
        // without adjusting internal thresholds like the eigenvalue gap ratio.
        const targetRms = 0.1;
        const gain = targetRms / rms;
        const normalizedBuffer = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            normalizedBuffer[i] = buffer[i] * gain;
        }

        // Step 0: Decimate — anti-alias filter + downsample by factor D
        const decimatedLen = this._decimateBuffer(normalizedBuffer);
        const effectiveSampleRate = sampleRate / this.D;

        // Safety check: need enough decimated samples for autocorrelation
        if (decimatedLen < this.M + 10) {
            if (this.debug) this.debugData = null;
            return -1;
        }

        // Step 1: Compute autocorrelation on decimated buffer
        this._computeAutocorrelation(decimatedLen);

        // Step 2: Build Toeplitz matrix
        this._buildToeplitzMatrix();

        // Step 3: Eigenvalue decomposition (the "PCA step")
        const sweeps = this._jacobiEigen();
        if (sweeps === -1) {
            if (this.debug) this.debugData = null;
            return -1;
        }

        // Step 4: Estimate signal subspace dimension
        const p = this._estimateSignalDimension();
        if (p < 0) {
            if (this.debug) this.debugData = null;
            return -1;
        }

        // Step 5: Scan pseudospectrum (using effective sample rate)
        const peaks = this._scanPseudospectrum(effectiveSampleRate, p);
        if (peaks.length === 0) {
            if (this.debug) this.debugData = null;
            return -1;
        }



        // Step 6: Identify fundamental (with sub-harmonic checking)
        const frequency = this._findFundamental(peaks, effectiveSampleRate, p);

        if (frequency < TunerDefaults.MIN_FREQUENCY ||
            frequency > TunerDefaults.MAX_FREQUENCY) {
            if (this.debug) this.debugData = null;
            return -1;
        }



        // Capture debug data
        if (this.debug) {
            // Build sorted eigenvalue array for display
            const sortedEigs = new Float64Array(this.M);
            for (let i = 0; i < this.M; i++) {
                sortedEigs[i] = this._eigenvalues[this._sortedIndices[i]];
            }

            // Capture coarse pseudospectrum for display
            const displayN = 300;
            const nyquist = effectiveSampleRate / 2;
            const maxDispF = Math.min(TunerDefaults.MAX_FREQUENCY, nyquist * 0.95);
            const logMin = Math.log(TunerDefaults.MIN_FREQUENCY);
            const logMax = Math.log(maxDispF);
            const displayFreqs = new Float64Array(displayN);
            const displayScores = new Float64Array(displayN);
            for (let i = 0; i < displayN; i++) {
                const f = Math.exp(logMin + (logMax - logMin) * i / (displayN - 1));
                displayFreqs[i] = f;
                displayScores[i] = this._computePseudospectrum(f, effectiveSampleRate, p);
            }

            this.debugData = {
                eigenvalues: sortedEigs,
                signalDimension: p,
                pseudoFreqs: displayFreqs,
                pseudoScores: displayScores,
                peaks: peaks,
                frequency: frequency,
                rms: rms,
                modelOrder: this.M,
                decimationFactor: this.D,
                effectiveSampleRate: effectiveSampleRate,
                sweeps: sweeps,
                sampleRate: sampleRate
            };
        }

        return frequency;
    }
}
