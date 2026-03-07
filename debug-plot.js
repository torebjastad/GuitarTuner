/**
 * Debug Visualization for pitch detection algorithms.
 * Draws algorithm-specific debug data on a canvas with annotated steps.
 * Depends on: (no dependencies, standalone UI component)
 */
class DebugPlot {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.infoEl = document.getElementById('debug-info');
        this.visible = false;
        // Performance tracking
        this.perfHistory = [];
        this.perfHistoryMax = 60;
    }

    toggle(show) {
        this.visible = show;
        if (this.canvas) {
            this.canvas.parentElement.style.display = show ? 'block' : 'none';
        }
        if (!show) {
            this.clear();
            this.perfHistory = [];
        }
    }

    clear() {
        if (!this.ctx) return;
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);
        if (this.infoEl) this.infoEl.innerHTML = '';
    }

    recordPerf(ms) {
        this.perfHistory.push(ms);
        if (this.perfHistory.length > this.perfHistoryMax) this.perfHistory.shift();
    }

    updateInfo(algoName, debugData, perfMs) {
        if (!this.infoEl) return;
        this.recordPerf(perfMs);

        const avg = this.perfHistory.reduce((a, b) => a + b, 0) / this.perfHistory.length;
        const max = Math.max(...this.perfHistory);
        const frameBudget = 16.67; // 60fps
        const loadPct = (avg / frameBudget) * 100;

        // Performance color class
        const perfClass = loadPct < 15 ? 'perf-good' : loadPct < 50 ? 'perf-ok' : 'perf-bad';
        const loadLabel = loadPct < 15 ? 'light' : loadPct < 50 ? 'moderate' : 'heavy';

        const s = (label, val) => `<span>${label}: ${val}</span>`;

        let items = [s('Algorithm', algoName)];

        if (algoName === 'YIN' && debugData) {
            items.push(
                s('Freq', debugData.frequency > 0 ? debugData.frequency.toFixed(2) + ' Hz' : 'rejected'),
                s('τ', debugData.interpolatedTau.toFixed(2)),
                s('Confidence', (debugData.probability * 100).toFixed(1) + '%'),
                s('Octave corr.', debugData.octaveCorrected ? 'yes' : 'no'),
            );
        } else if (algoName === 'McLeod' && debugData) {
            items.push(
                s('Freq', debugData.frequency > 0 ? debugData.frequency.toFixed(2) + ' Hz' : 'rejected'),
                s('τ', debugData.interpolatedTau.toFixed(2)),
                s('Clarity', (debugData.clarity * 100).toFixed(1) + '%'),
                s('Key maxima', debugData.keyMaxima.length),
                s('Threshold', debugData.threshold.toFixed(3)),
            );
        } else if (algoName === 'Autocorr' && debugData) {
            items.push(
                s('Freq', debugData.frequency.toFixed(2) + ' Hz'),
                s('T₀', debugData.interpolatedT0.toFixed(2)),
                s('RMS', debugData.rms.toFixed(4)),
                s('Trimmed', `[${debugData.r1}..${debugData.r2}]`),
            );
        } else if (algoName === 'HPS' && debugData) {
            items.push(
                s('Freq', debugData.frequency > 0 ? debugData.frequency.toFixed(2) + ' Hz' : 'rejected'),
                s('Bin', debugData.interpolatedBin.toFixed(2)),
                s('SNR', debugData.snr.toFixed(1)),
                s('RMS', debugData.rms.toFixed(4)),
                s('Harmonics', debugData.numHarmonics),
                s('FFT', debugData.fftSize),
            );
        }

        items.push(
            s('Calc', perfMs.toFixed(2) + ' ms'),
            s('Avg', avg.toFixed(2) + ' ms'),
            s('Peak', max.toFixed(2) + ' ms'),
            `<span class="${perfClass}">CPU: ${loadPct.toFixed(1)}% (${loadLabel})</span>`,
        );

        this.infoEl.innerHTML = items.join('');
    }

    draw(debugData) {
        if (!this.visible || !this.ctx || !debugData) return;

        const canvas = this.canvas;
        const ctx = this.ctx;
        const dpr = window.devicePixelRatio || 1;

        // Size canvas to container
        const W = canvas.parentElement.getBoundingClientRect().width;
        const H = 250;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.scale(dpr, dpr);
        const pad = { top: 25, bottom: 35, left: 50, right: 15 };
        const plotW = W - pad.left - pad.right;
        const plotH = H - pad.top - pad.bottom;

        ctx.clearRect(0, 0, W, H);

        const { cmnd, threshold, initialTau, correctedTau, interpolatedTau,
            octaveCorrected, probability, frequency, sampleRate, bufferLength } = debugData;

        // Static x-axis: always show the full computed tau range
        const maxTauDisplay = bufferLength;

        // Find Y range (CMND values typically 0–2, but clamp for display)
        const yMax = 2.0;
        const yMin = 0;

        // Helper: data coords to pixel coords
        const toX = (tau) => pad.left + (tau / maxTauDisplay) * plotW;
        const toY = (val) => pad.top + (1 - (val - yMin) / (yMax - yMin)) * plotH;

        // Background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.fillRect(0, 0, W, H);

        // Grid lines
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.lineWidth = 1;
        for (let v = 0; v <= yMax; v += 0.5) {
            const y = toY(v);
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(W - pad.right, y);
            ctx.stroke();
        }

        // Y-axis labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Outfit, sans-serif';
        ctx.textAlign = 'right';
        for (let v = 0; v <= yMax; v += 0.5) {
            ctx.fillText(v.toFixed(1), pad.left - 6, toY(v) + 4);
        }

        // X-axis tick labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        const xStep = maxTauDisplay <= 300 ? 50
            : maxTauDisplay <= 600 ? 100
                : 200;
        for (let t = xStep; t < maxTauDisplay; t += xStep) {
            const x = toX(t);
            // Tick mark
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, pad.top + plotH);
            ctx.lineTo(x, pad.top + plotH + 5);
            ctx.stroke();
            // Label
            ctx.fillText(t, x, pad.top + plotH + 17);
        }
        ctx.fillText('lag (samples)', pad.left + plotW / 2, H - 4);

        // Draw CMND curve
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 1; i < maxTauDisplay; i++) {
            const x = toX(i);
            const y = toY(Math.min(cmnd[i], yMax));
            if (i === 1) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw threshold line
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(pad.left, toY(threshold));
        ctx.lineTo(W - pad.right, toY(threshold));
        ctx.stroke();
        ctx.setLineDash([]);

        // Label threshold
        ctx.fillStyle = '#fbbf24';
        ctx.font = '10px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`threshold = ${threshold}`, pad.left + 4, toY(threshold) - 5);

        // Draw octave-correction threshold line (0.3)
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(pad.left, toY(0.3));
        ctx.lineTo(W - pad.right, toY(0.3));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
        ctx.fillText('octave corr. = 0.3', pad.left + 4, toY(0.3) - 5);

        // Mark initial tau (Step 3 result)
        if (initialTau > 0 && initialTau < maxTauDisplay) {
            const ix = toX(initialTau);
            const iy = toY(Math.min(cmnd[initialTau], yMax));

            // Vertical line
            ctx.strokeStyle = octaveCorrected ? 'rgba(248, 113, 113, 0.4)' : 'rgba(74, 222, 128, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(ix, pad.top);
            ctx.lineTo(ix, pad.top + plotH);
            ctx.stroke();
            ctx.setLineDash([]);

            // Dot
            ctx.fillStyle = octaveCorrected ? '#f87171' : '#4ade80';
            ctx.beginPath();
            ctx.arc(ix, iy, 4, 0, Math.PI * 2);
            ctx.fill();

            // Label
            ctx.font = '10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            const initFreq = sampleRate / initialTau;
            ctx.fillText(
                `Step 3: τ=${initialTau} (${initFreq.toFixed(1)} Hz)`,
                ix, pad.top - 5
            );
        }

        // Mark corrected tau (Step 4 result) if octave correction applied
        if (octaveCorrected && correctedTau > 0 && correctedTau < maxTauDisplay) {
            const cx = toX(correctedTau);
            const cy = toY(Math.min(cmnd[correctedTau], yMax));

            // Vertical line
            ctx.strokeStyle = 'rgba(74, 222, 128, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(cx, pad.top);
            ctx.lineTo(cx, pad.top + plotH);
            ctx.stroke();
            ctx.setLineDash([]);

            // Arrow from initial to corrected
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([]);
            ctx.beginPath();
            const ix = toX(initialTau);
            const midY = pad.top + 14;
            ctx.moveTo(ix, midY);
            ctx.lineTo(cx, midY);
            // Arrowhead
            ctx.lineTo(cx - 6, midY - 4);
            ctx.moveTo(cx, midY);
            ctx.lineTo(cx - 6, midY + 4);
            ctx.stroke();

            // Dot
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.arc(cx, cy, 4, 0, Math.PI * 2);
            ctx.fill();

            // Label
            ctx.font = '10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            const corrFreq = sampleRate / correctedTau;
            ctx.fillText(
                `Step 4: τ=${correctedTau} (${corrFreq.toFixed(1)} Hz)`,
                cx, cy - 10
            );
        }

        // Mark final interpolated tau (Step 5)
        if (interpolatedTau > 0 && interpolatedTau < maxTauDisplay) {
            const fx = toX(interpolatedTau);

            // Vertical line — final result
            ctx.strokeStyle = 'rgba(74, 222, 128, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(fx, pad.top + plotH - 20);
            ctx.lineTo(fx, pad.top + plotH);
            ctx.stroke();

            // Triangle marker at bottom
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.moveTo(fx, pad.top + plotH - 20);
            ctx.lineTo(fx - 5, pad.top + plotH - 12);
            ctx.lineTo(fx + 5, pad.top + plotH - 12);
            ctx.closePath();
            ctx.fill();
        }

    }

    drawAutocorrelation(debugData) {
        if (!this.visible || !this.ctx || !debugData) return;

        const canvas = this.canvas;
        const ctx = this.ctx;
        const dpr = window.devicePixelRatio || 1;

        const W = canvas.parentElement.getBoundingClientRect().width;
        const H = 250;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.scale(dpr, dpr);
        const pad = { top: 25, bottom: 35, left: 50, right: 15 };
        const plotW = W - pad.left - pad.right;
        const plotH = H - pad.top - pad.bottom;

        ctx.clearRect(0, 0, W, H);

        const { autocorr, r1, r2, trimmedSize, firstDip, peakPos, peakVal,
            interpolatedT0, rms, frequency, sampleRate } = debugData;

        // Static x-axis: always show the full computed lag range
        const maxLagDisplay = autocorr.length;

        // Y range: autocorrelation from min to max in the visible range
        let yMin = 0, yMax = 0;
        for (let i = 0; i < maxLagDisplay && i < autocorr.length; i++) {
            if (autocorr[i] > yMax) yMax = autocorr[i];
            if (autocorr[i] < yMin) yMin = autocorr[i];
        }
        // Add some padding
        const yRange = yMax - yMin || 1;
        yMax += yRange * 0.05;
        yMin -= yRange * 0.05;

        const toX = (lag) => pad.left + (lag / maxLagDisplay) * plotW;
        const toY = (val) => pad.top + (1 - (val - yMin) / (yMax - yMin)) * plotH;

        // Background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.fillRect(0, 0, W, H);

        // Grid lines (horizontal)
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.lineWidth = 1;
        const yStep = Math.pow(10, Math.floor(Math.log10(yRange / 4)));
        const yGridStep = yRange / 4 < yStep * 2.5 ? yStep : yStep * 2.5;
        const yGridStart = Math.ceil(yMin / yGridStep) * yGridStep;
        for (let v = yGridStart; v <= yMax; v += yGridStep) {
            const y = toY(v);
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(W - pad.right, y);
            ctx.stroke();
        }

        // Y-axis labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Outfit, sans-serif';
        ctx.textAlign = 'right';
        for (let v = yGridStart; v <= yMax; v += yGridStep) {
            const label = Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(0);
            ctx.fillText(label, pad.left - 6, toY(v) + 4);
        }

        // Zero line
        if (yMin < 0) {
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pad.left, toY(0));
            ctx.lineTo(W - pad.right, toY(0));
            ctx.stroke();
        }

        // X-axis tick labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        const xStep = maxLagDisplay <= 300 ? 50
            : maxLagDisplay <= 600 ? 100
                : 200;
        for (let t = xStep; t < maxLagDisplay; t += xStep) {
            const x = toX(t);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, pad.top + plotH);
            ctx.lineTo(x, pad.top + plotH + 5);
            ctx.stroke();
            ctx.fillText(t, x, pad.top + plotH + 17);
        }
        ctx.fillText('lag (samples)', pad.left + plotW / 2, H - 4);

        // Draw autocorrelation curve
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < maxLagDisplay && i < autocorr.length; i++) {
            const x = toX(i);
            const y = toY(autocorr[i]);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Mark first-dip point (Step 4: where autocorrelation stops decreasing)
        if (firstDip > 0 && firstDip < maxLagDisplay) {
            const dx = toX(firstDip);
            const dy = toY(autocorr[firstDip]);

            ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(dx, pad.top);
            ctx.lineTo(dx, pad.top + plotH);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(dx, dy, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = '10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`First dip: ${firstDip}`, dx, pad.top - 5);
        }

        // Mark detected peak (Step 4: argmax after first dip)
        if (peakPos > 0 && peakPos < maxLagDisplay) {
            const px = toX(peakPos);
            const py = toY(autocorr[peakPos]);

            ctx.strokeStyle = 'rgba(248, 113, 113, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(px, pad.top);
            ctx.lineTo(px, pad.top + plotH);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#f87171';
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = '10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            const peakFreq = sampleRate / peakPos;
            ctx.fillText(
                `Peak: T₀=${peakPos} (${peakFreq.toFixed(1)} Hz)`,
                px, py - 10
            );
        }

        // Mark interpolated T0 (Step 5: parabolic refinement)
        if (interpolatedT0 > 0 && interpolatedT0 < maxLagDisplay) {
            const fx = toX(interpolatedT0);

            ctx.strokeStyle = 'rgba(74, 222, 128, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(fx, pad.top + plotH - 20);
            ctx.lineTo(fx, pad.top + plotH);
            ctx.stroke();

            // Triangle marker
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.moveTo(fx, pad.top + plotH - 20);
            ctx.lineTo(fx - 5, pad.top + plotH - 12);
            ctx.lineTo(fx + 5, pad.top + plotH - 12);
            ctx.closePath();
            ctx.fill();
        }

    }

    drawMcLeod(debugData) {
        if (!this.visible || !this.ctx || !debugData) return;

        const canvas = this.canvas;
        const ctx = this.ctx;
        const dpr = window.devicePixelRatio || 1;

        const W = canvas.parentElement.getBoundingClientRect().width;
        const H = 250;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.scale(dpr, dpr);
        const pad = { top: 25, bottom: 35, left: 50, right: 15 };
        const plotW = W - pad.left - pad.right;
        const plotH = H - pad.top - pad.bottom;

        ctx.clearRect(0, 0, W, H);

        const { nsdf, keyMaxima, threshold, selectedTau, interpolatedTau,
            clarity, frequency, sampleRate, bufferLength } = debugData;

        // Static x-axis: always show the full computed tau range
        const maxTauDisplay = bufferLength;

        // NSDF range is [-1, +1]
        const yMax = 1.1;
        const yMin = -0.5;

        const toX = (tau) => pad.left + (tau / maxTauDisplay) * plotW;
        const toY = (val) => pad.top + (1 - (val - yMin) / (yMax - yMin)) * plotH;

        // Background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.fillRect(0, 0, W, H);

        // Grid lines
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.lineWidth = 1;
        for (let v = -0.5; v <= 1.0; v += 0.25) {
            const y = toY(v);
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(W - pad.right, y);
            ctx.stroke();
        }

        // Zero line (prominent)
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad.left, toY(0));
        ctx.lineTo(W - pad.right, toY(0));
        ctx.stroke();

        // Y-axis labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Outfit, sans-serif';
        ctx.textAlign = 'right';
        for (let v = -0.5; v <= 1.0; v += 0.5) {
            ctx.fillText(v.toFixed(1), pad.left - 6, toY(v) + 4);
        }

        // X-axis tick labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        const xStep = maxTauDisplay <= 300 ? 50
            : maxTauDisplay <= 600 ? 100
                : 200;
        for (let t = xStep; t < maxTauDisplay; t += xStep) {
            const x = toX(t);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, pad.top + plotH);
            ctx.lineTo(x, pad.top + plotH + 5);
            ctx.stroke();
            ctx.fillText(t, x, pad.top + plotH + 17);
        }
        ctx.fillText('lag (samples)', pad.left + plotW / 2, H - 4);

        // Draw NSDF curve
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 1; i < maxTauDisplay && i < bufferLength; i++) {
            const x = toX(i);
            const y = toY(Math.max(yMin, Math.min(nsdf[i], yMax)));
            if (i === 1) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw relative threshold line
        if (threshold > yMin) {
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
            ctx.lineWidth = 1;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(pad.left, toY(threshold));
            ctx.lineTo(W - pad.right, toY(threshold));
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#fbbf24';
            ctx.font = '10px Outfit, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`threshold = ${threshold.toFixed(3)}`, pad.left + 4, toY(threshold) - 5);
        }

        // Mark all key maxima (orange dots)
        for (let i = 0; i < keyMaxima.length; i++) {
            const km = keyMaxima[i];
            if (km.tau >= maxTauDisplay) continue;
            const kx = toX(km.tau);
            const ky = toY(Math.min(km.val, yMax));

            ctx.fillStyle = km.tau === selectedTau ? '#f87171' : 'rgba(251, 146, 60, 0.7)';
            ctx.beginPath();
            ctx.arc(kx, ky, km.tau === selectedTau ? 5 : 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Mark selected peak with label
        if (selectedTau > 0 && selectedTau < maxTauDisplay) {
            const sx = toX(selectedTau);
            const sy = toY(Math.min(nsdf[selectedTau], yMax));

            // Vertical dashed line
            ctx.strokeStyle = 'rgba(248, 113, 113, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(sx, pad.top);
            ctx.lineTo(sx, pad.top + plotH);
            ctx.stroke();
            ctx.setLineDash([]);

            // Label
            ctx.fillStyle = '#f87171';
            ctx.font = '10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            const peakFreq = sampleRate / selectedTau;
            ctx.fillText(
                `Peak: τ=${selectedTau} (${peakFreq.toFixed(1)} Hz)`,
                sx, pad.top - 5
            );
        }

        // Mark interpolated tau (final result)
        if (interpolatedTau > 0 && interpolatedTau < maxTauDisplay) {
            const fx = toX(interpolatedTau);

            ctx.strokeStyle = 'rgba(74, 222, 128, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(fx, pad.top + plotH - 20);
            ctx.lineTo(fx, pad.top + plotH);
            ctx.stroke();

            // Triangle marker
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.moveTo(fx, pad.top + plotH - 20);
            ctx.lineTo(fx - 5, pad.top + plotH - 12);
            ctx.lineTo(fx + 5, pad.top + plotH - 12);
            ctx.closePath();
            ctx.fill();
        }

    }

    drawHps(debugData) {
        if (!this.visible || !this.ctx || !debugData) return;

        const canvas = this.canvas;
        const ctx = this.ctx;
        const dpr = window.devicePixelRatio || 1;

        const W = canvas.parentElement.getBoundingClientRect().width;
        const H = 250;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.scale(dpr, dpr);
        const pad = { top: 25, bottom: 35, left: 50, right: 15 };
        const plotW = W - pad.left - pad.right;
        const plotH = H - pad.top - pad.bottom;

        ctx.clearRect(0, 0, W, H);

        const { magnitudeSpectrum, hpsSpectrum, peakBin, interpolatedBin,
            peakVal, snr, frequency, sampleRate, fftSize, minBin, maxBin, numHarmonics } = debugData;

        // X-axis: frequency in Hz (show from 0 to MAX_FREQUENCY)
        const maxFreqDisplay = TunerDefaults.MAX_FREQUENCY;
        const binToFreq = (bin) => bin * sampleRate / fftSize;
        const freqToBin = (freq) => freq * fftSize / sampleRate;

        const toX = (freq) => pad.left + (freq / maxFreqDisplay) * plotW;

        // Y-axis for HPS spectrum (log domain)
        let hpsMin = Infinity, hpsMax = -Infinity;
        for (let i = minBin; i < maxBin; i++) {
            if (hpsSpectrum[i] > hpsMax) hpsMax = hpsSpectrum[i];
            if (hpsSpectrum[i] < hpsMin && hpsSpectrum[i] > -50) hpsMin = hpsSpectrum[i];
        }
        const hpsRange = hpsMax - hpsMin || 1;
        hpsMax += hpsRange * 0.05;
        hpsMin -= hpsRange * 0.1;

        const toY = (val) => pad.top + (1 - (val - hpsMin) / (hpsMax - hpsMin)) * plotH;

        // Background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.fillRect(0, 0, W, H);

        // Grid lines
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.lineWidth = 1;
        const yGridCount = 5;
        for (let i = 0; i <= yGridCount; i++) {
            const v = hpsMin + (hpsMax - hpsMin) * i / yGridCount;
            const y = toY(v);
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(W - pad.right, y);
            ctx.stroke();
        }

        // X-axis tick labels (frequency in Hz)
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        const freqStep = maxFreqDisplay <= 500 ? 50
            : maxFreqDisplay <= 1500 ? 200
                : 500;
        for (let f = freqStep; f < maxFreqDisplay; f += freqStep) {
            const x = toX(f);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, pad.top + plotH);
            ctx.lineTo(x, pad.top + plotH + 5);
            ctx.stroke();
            ctx.fillText(f + ' Hz', x, pad.top + plotH + 17);
        }
        ctx.fillText('frequency (Hz)', pad.left + plotW / 2, H - 4);

        // Draw magnitude spectrum (faint blue, normalized to fit)
        let magMax = 0;
        const magDisplayMax = Math.min(magnitudeSpectrum.length, Math.ceil(freqToBin(maxFreqDisplay)));
        for (let i = 0; i < magDisplayMax; i++) {
            if (magnitudeSpectrum[i] > magMax) magMax = magnitudeSpectrum[i];
        }
        if (magMax > 0) {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            let started = false;
            for (let i = 1; i < magDisplayMax; i++) {
                const freq = binToFreq(i);
                if (freq > maxFreqDisplay) break;
                const x = toX(freq);
                const normalizedVal = hpsMin + (magnitudeSpectrum[i] / magMax) * (hpsMax - hpsMin);
                const y = toY(normalizedVal);
                if (!started) { ctx.moveTo(x, y); started = true; }
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // Draw HPS spectrum (green, main curve)
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let started = false;
        for (let i = minBin; i < maxBin; i++) {
            const freq = binToFreq(i);
            if (freq > maxFreqDisplay) break;
            const x = toX(freq);
            const y = toY(Math.max(hpsMin, hpsSpectrum[i]));
            if (!started) { ctx.moveTo(x, y); started = true; }
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Mark detected peak
        if (peakBin >= minBin && peakBin < maxBin) {
            const peakFreq = binToFreq(peakBin);
            const px = toX(peakFreq);
            const py = toY(hpsSpectrum[peakBin]);

            // Vertical dashed line
            ctx.strokeStyle = 'rgba(248, 113, 113, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(px, pad.top);
            ctx.lineTo(px, pad.top + plotH);
            ctx.stroke();
            ctx.setLineDash([]);

            // Dot
            ctx.fillStyle = '#f87171';
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fill();

            // Label
            ctx.font = '10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
                `Peak: ${peakFreq.toFixed(1)} Hz (bin ${peakBin})`,
                px, pad.top - 5
            );
        }

        // Mark interpolated frequency (final result)
        if (frequency > 0) {
            const fx = toX(frequency);

            // Triangle marker at bottom
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.moveTo(fx, pad.top + plotH - 20);
            ctx.lineTo(fx - 5, pad.top + plotH - 12);
            ctx.lineTo(fx + 5, pad.top + plotH - 12);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'rgba(74, 222, 128, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(fx, pad.top + plotH - 20);
            ctx.lineTo(fx, pad.top + plotH);
            ctx.stroke();
        }

        // Legend
        ctx.font = '10px Outfit, sans-serif';
        ctx.textAlign = 'left';
        const lx = pad.left + 8;
        const ly = pad.top + 14;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.fillText('— Magnitude spectrum', lx, ly);
        ctx.fillStyle = '#4ade80';
        ctx.fillText('— HPS product (' + numHarmonics + ' harmonics)', lx, ly + 13);
    }
}
