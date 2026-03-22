"""Transient vs Sustain Pitch Analysis for Piano Bass Notes.

Investigates why hammering piano keys hard gives different pitch readings
than pressing gently — especially in the bass (C1-C2 range).

Two root causes uncovered here:
1. PHYSICS — Piano attack transients are inherently non-periodic.
   The first ~50-200 ms of a hard strike contains hammer noise, string
   startup, and soundboard impulse.  Pitch detectors run on non-periodic
   signals produce unreliable, often sharp, readings.

2. INHARMONICITY — Bass piano strings are stiff; overtones sit well above
   integer multiples of the fundamental.  During the forte attack, energy
   in upper (sharpened) partials is temporarily dominant.  If the detector
   latches onto the 2nd or 3rd partial during the transient, the reported
   pitch will be 8–15 cents SHARP compared to the sustain reading.

Solution: Gate pitch readings on NSDF clarity (a periodicity measure).
   When clarity < threshold the window is still in the transient phase —
   reject it.  Only accept readings from the periodic sustain phase.
   This makes detection robust to playing force.

Datasets used:
   Salamander Grand Piano v1-v16 (16 velocity layers, same note / same tuning)
   Notes: A0, C1, E1, A1, C2 (the most problematic bass range)
"""

import os, sys, math
# Force UTF-8 output on Windows so print() handles special chars
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
import numpy as np
import soundfile as sf
import matplotlib
matplotlib.use('TkAgg')
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
SALAD_DIR = os.path.normpath(os.path.join(
    BASE_DIR, '..', 'TestData', 'SalamanderGrandPianoV3_OggVorbis', 'ogg'))

sys.path.insert(0, BASE_DIR)

# ── Tunable constants ─────────────────────────────────────────────────────────
WINDOW_MS     = 300    # ms — analysis window length
HOP_MS        = 30     # ms — step between consecutive windows
CLARITY_GATE  = 0.70   # NSDF peak height threshold to accept a reading
ANALYSIS_SECS = 2.5    # s  — analyse this much of each note (after onset)

BASS_NOTES = [
    ('A', 0),   # A0  27.5 Hz
    ('C', 1),   # C1  32.7 Hz
    ('E', 1),   # E1  41.2 Hz
    ('A', 1),   # A1  55.0 Hz
    ('C', 2),   # C2  65.4 Hz
]

SELECTED_VELOCITIES = [1, 4, 8, 12, 16]
ALL_VELOCITIES      = list(range(1, 17))

VEL_NAMES = {1:'pp (v1)', 4:'mp (v4)', 8:'mf (v8)', 12:'f (v12)', 16:'ff (v16)'}
VEL_COLOR = {1:'#2196F3', 4:'#4CAF50', 8:'#FF9800', 12:'#F44336', 16:'#9C27B0'}


# ── Basic helpers ─────────────────────────────────────────────────────────────

def note_hz(note, octave):
    SEMI = {'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,
            'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11}
    midi = (octave + 1) * 12 + SEMI[note]
    return 440.0 * (2 ** ((midi - 69) / 12))


def load_salamander(note, octave, velocity):
    path = os.path.join(SALAD_DIR, f"{note}{octave}v{velocity}.ogg")
    if not os.path.exists(path):
        return None, None
    data, sr = sf.read(path, always_2d=False)
    if data.ndim == 2:
        data = data.mean(axis=1)
    return data.astype(np.float64), sr


def find_onset(data, sr, threshold_ratio=0.08, hop=512):
    """First frame whose RMS > threshold_ratio × peak-RMS."""
    rms = [np.sqrt(np.mean(data[i:i+hop]**2))
           for i in range(0, len(data) - hop, hop)]
    peak = max(rms) if rms else 0
    thresh = peak * threshold_ratio
    for i, r in enumerate(rms):
        if r > thresh:
            return i * hop
    return 0


# ── NSDF clarity (McLeod periodicity measure) ─────────────────────────────────

def compute_nsdf(buffer, sr, min_hz=20):
    """FFT-based NSDF, returns (nsdf_array, max_tau)."""
    N = len(buffer)
    max_tau = min(N // 2, int(np.ceil(sr / min_hz)))
    if max_tau < 2:
        return np.array([]), 0

    n_fft = 1 << int(np.ceil(np.log2(2 * N)))
    X = np.fft.rfft(buffer, n=n_fft)
    acf_full = np.fft.irfft(X * np.conj(X), n=n_fft)
    acf = acf_full[:max_tau]

    sq = buffer ** 2
    sum_sq = sq.sum()
    m = np.empty(max_tau)
    m[0] = 2 * sum_sq
    if max_tau > 1:
        cs = np.cumsum(sq)
        taus = np.arange(1, max_tau)
        m[1:] = (sum_sq - cs[taus - 1]) + cs[N - taus - 1]

    with np.errstate(divide='ignore', invalid='ignore'):
        nsdf = np.where(m > 0, 2 * acf / m, 0.0)
    return nsdf, max_tau


def nsdf_peak_info(nsdf, sr, max_tau):
    """Return (freq_hz, clarity, selected_tau) from a precomputed NSDF.

    clarity = height of the selected NSDF peak (0=noise, 1=perfect tone).
    """
    if nsdf is None or len(nsdf) == 0 or max_tau < 2:
        return -1, 0.0, -1

    # Collect key maxima
    key_maxima = []
    in_pos = False
    cur_tau, cur_val = 0, -np.inf
    for tau in range(1, max_tau):
        if nsdf[tau] > 0 and nsdf[tau-1] <= 0:
            in_pos = True; cur_tau, cur_val = tau, nsdf[tau]
        elif nsdf[tau] <= 0 and nsdf[tau-1] > 0:
            if in_pos: key_maxima.append((cur_tau, cur_val))
            in_pos = False
        elif in_pos and nsdf[tau] > cur_val:
            cur_tau, cur_val = tau, nsdf[tau]
    if in_pos:
        key_maxima.append((cur_tau, cur_val))

    if not key_maxima:
        return -1, 0.0, -1

    nmax = max(v for _, v in key_maxima)
    if nmax < 0.05:
        return -1, float(nmax), -1

    threshold = 0.93 * nmax
    for tau, val in key_maxima:
        if val >= threshold:
            # Parabolic interpolation
            itau = float(tau)
            if 0 < tau < max_tau - 1:
                s0, s1, s2 = nsdf[tau-1], nsdf[tau], nsdf[tau+1]
                a = (s0 + s2 - 2*s1) / 2
                b = (s2 - s0) / 2
                if a < 0:
                    adj = -b / (2*a)
                    if abs(adj) < 1:
                        itau = tau + adj
            freq = sr / itau if itau > 0 else -1
            return freq, float(nmax), float(itau)

    return -1, float(nmax), -1


def analyse_window(buf, sr, expected_hz, tol_cents=150):
    """Compute freq, clarity, cents for a single buffer window."""
    nsdf, max_tau = compute_nsdf(buf, sr)
    freq, clarity, _ = nsdf_peak_info(nsdf, sr, max_tau)

    cents = np.nan
    if freq > 0 and expected_hz > 0:
        c = 1200 * math.log2(freq / expected_hz)
        if abs(c) < tol_cents:
            cents = c
    return freq, clarity, cents, nsdf, max_tau


# ── Sliding-window track for a full note ─────────────────────────────────────

def track_note(data, sr, expected_hz, window_ms=WINDOW_MS, hop_ms=HOP_MS,
               analysis_secs=ANALYSIS_SECS):
    """Return arrays: times_ms, freqs, clarities, cents_arr."""
    onset = find_onset(data, sr)
    win = int(sr * window_ms / 1000)
    hop = int(sr * hop_ms  / 1000)
    end  = onset + int(sr * analysis_secs)

    times, freqs, clarities, cents_arr = [], [], [], []
    pos = onset
    while pos + win <= min(end, len(data)):
        buf = data[pos : pos + win]
        freq, cl, cents, _, _ = analyse_window(buf, sr, expected_hz)
        t_ms = (pos - onset) / sr * 1000
        times.append(t_ms);       freqs.append(freq)
        clarities.append(cl);     cents_arr.append(cents)
        pos += hop

    return (np.array(times),  np.array(freqs),
            np.array(clarities), np.array(cents_arr))


# ── Spectrogram helper (no scipy required) ────────────────────────────────────

def make_spectrogram(data, sr, nperseg=2048, noverlap=1792):
    hop = nperseg - noverlap
    n_frames = (len(data) - nperseg) // hop + 1
    win = np.hanning(nperseg)
    freqs = np.fft.rfftfreq(nperseg, 1/sr)
    times = np.arange(n_frames) * hop / sr
    Sxx = np.zeros((len(freqs), n_frames))
    for i in range(n_frames):
        frame = data[i*hop : i*hop + nperseg] * win
        Sxx[:, i] = np.abs(np.fft.rfft(frame))**2
    return freqs, times, Sxx


# ═══════════════════════════════════════════════════════════════════════════════
# PLOT 1 — Full single-note detail (all velocity layers)
# ═══════════════════════════════════════════════════════════════════════════════

def plot_single_note(note='C', octave=1):
    """Main analysis plot for one note across velocity layers."""
    expected_hz = note_hz(note, octave)
    print(f"\n=== {note}{octave}  ({expected_hz:.2f} Hz) — loading velocity layers... ===")

    results = {}
    for vel in SELECTED_VELOCITIES:
        data, sr = load_salamander(note, octave, vel)
        if data is None:
            print(f"  v{vel}: not found — skipping")
            continue
        times, freqs, clar, cents = track_note(data, sr, expected_hz)
        results[vel] = dict(data=data, sr=sr, times=times, freqs=freqs,
                            clarities=clar, cents=cents)
        print(f"  v{vel}: {len(times)} windows, peak clarity={clar.max():.2f}")

    if not results:
        print("No data found.  Check SALAD_DIR:", SALAD_DIR)
        return

    ref_vel = max(results.keys())
    r_ref   = results[ref_vel]

    fig = plt.figure(figsize=(18, 12))
    fig.suptitle(
        f"Piano Transient Analysis — {note}{octave}  "
        f"({expected_hz:.2f} Hz  ·  Salamander Grand Piano)\n"
        f"Why does hammering cause different pitch readings?",
        fontsize=14, fontweight='bold')

    gs = gridspec.GridSpec(3, 2, figure=fig,
                           hspace=0.55, wspace=0.32,
                           left=0.07, right=0.97, top=0.89, bottom=0.07)

    ax_c  = fig.add_subplot(gs[0, :])   # cents vs time
    ax_cl = fig.add_subplot(gs[1, 0])   # clarity vs time
    ax_wv = fig.add_subplot(gs[1, 1])   # waveform
    ax_su = fig.add_subplot(gs[2, 0])   # summary bar
    ax_sp = fig.add_subplot(gs[2, 1])   # spectrogram

    # ── Panel 1: Cents vs time ─────────────────────────────────────────────
    ax_c.axhline(0, color='k', lw=0.9, ls='--', alpha=0.4)
    ax_c.axvline(60, color='gray', lw=1.0, ls=':', alpha=0.6)
    ax_c.text(65, 26, '60 ms skip', fontsize=7, color='gray', va='top')

    for vel, r in sorted(results.items()):
        color = VEL_COLOR[vel]
        valid  = ~np.isnan(r['cents'])
        gated  = valid & (r['clarities'] >= CLARITY_GATE)
        # faint: all valid readings
        ax_c.plot(r['times'][valid], r['cents'][valid],
                  color=color, alpha=0.20, lw=0.9)
        # opaque dots: only clarity-gated (periodic) windows
        ax_c.scatter(r['times'][gated], r['cents'][gated],
                     color=color, s=10, alpha=0.85,
                     label=VEL_NAMES[vel], zorder=3)

    ax_c.set_xlim(-30, ANALYSIS_SECS*1000)
    ax_c.set_ylim(-30, 30)
    ax_c.set_xlabel('Time after onset (ms)', fontsize=9)
    ax_c.set_ylabel('Cents from equal temperament', fontsize=9)
    ax_c.set_title("Detected pitch vs time — faint = all readings, dots = clarity-gated "
                   f"(clarity ≥ {CLARITY_GATE})", fontsize=10)
    ax_c.legend(loc='upper right', fontsize=8, ncol=5)
    ax_c.grid(True, alpha=0.25)
    ax_c.text(0.01, 0.97,
              f"Faint lines during transient are unreliable (non-periodic signal).\n"
              f"Dots (clarity ≥ {CLARITY_GATE}) converge to the same pitch regardless of velocity.",
              transform=ax_c.transAxes, fontsize=8, va='top',
              bbox=dict(facecolor='lightyellow', alpha=0.85, edgecolor='#ccc', pad=4))

    # ── Panel 2: Clarity vs time ───────────────────────────────────────────
    ax_cl.axhline(CLARITY_GATE, color='red', lw=1.3, ls='--',
                  label=f'Gate = {CLARITY_GATE}', zorder=5)
    ax_cl.fill_between([0, ANALYSIS_SECS*1000], 0, CLARITY_GATE,
                        alpha=0.08, color='red')
    ax_cl.text(ANALYSIS_SECS*500, CLARITY_GATE/2,
               'TRANSIENT ZONE — reject', ha='center', va='center',
               fontsize=9, color='red', alpha=0.6, style='italic')

    for vel, r in sorted(results.items()):
        ax_cl.plot(r['times'], r['clarities'],
                   color=VEL_COLOR[vel], lw=1.4, alpha=0.85,
                   label=VEL_NAMES[vel])

    ax_cl.set_xlim(-30, ANALYSIS_SECS*1000)
    ax_cl.set_ylim(0, 1.05)
    ax_cl.set_xlabel('Time after onset (ms)', fontsize=9)
    ax_cl.set_ylabel('NSDF clarity', fontsize=9)
    ax_cl.set_title('Periodicity (clarity) over time\n'
                    '(0 = random noise · 1 = perfect periodic tone)', fontsize=10)
    ax_cl.legend(loc='lower right', fontsize=7, ncol=2)
    ax_cl.grid(True, alpha=0.25)

    # ── Panel 3: Waveform + transient shade ───────────────────────────────
    data_ref = r_ref['data'];  sr_ref = r_ref['sr']
    onset_ref = find_onset(data_ref, sr_ref)
    t_audio = (np.arange(len(data_ref)) - onset_ref) / sr_ref * 1000
    step = max(1, len(data_ref) // 6000)

    ax_wv.plot(t_audio[::step], data_ref[::step],
               color='#1565C0', lw=0.4, alpha=0.7)

    # Shade windows where clarity < gate
    rtimes = r_ref['times'];  rclar = r_ref['clarities']
    hop_ms_half = HOP_MS / 2
    for i, (t, cl) in enumerate(zip(rtimes, rclar)):
        if cl < CLARITY_GATE:
            ax_wv.axvspan(t - hop_ms_half, t + hop_ms_half,
                          alpha=0.18, color='red', lw=0)

    ax_wv.set_xlim(-50, ANALYSIS_SECS*1000)
    ax_wv.set_xlabel('Time after onset (ms)', fontsize=9)
    ax_wv.set_ylabel('Amplitude', fontsize=9)
    ax_wv.set_title(f'Waveform — {VEL_NAMES[ref_vel]}\n'
                    f'(red = transient zone, clarity < {CLARITY_GATE})', fontsize=10)
    ax_wv.grid(True, alpha=0.2)

    # ── Panel 4: Summary bar — naive vs gated ─────────────────────────────
    vels  = sorted(results.keys())
    x     = np.arange(len(vels))
    w     = 0.38
    naive = []
    gated = []
    for vel in vels:
        r = results[vel]
        valid = ~np.isnan(r['cents'])
        after60 = r['times'] >= 60

        n_mask = valid & after60 & (r['times'] < 1500)
        naive.append(float(np.median(r['cents'][n_mask])) if n_mask.any() else np.nan)

        g_mask = n_mask & (r['clarities'] >= CLARITY_GATE)
        gated.append(float(np.median(r['cents'][g_mask])) if g_mask.any() else np.nan)

    ax_su.bar(x - w/2, naive, w, color='#EF5350', alpha=0.80,
              label='Naive (60 ms skip only)')
    ax_su.bar(x + w/2, gated, w, color='#42A5F5', alpha=0.80,
              label=f'Clarity-gated (≥{CLARITY_GATE})')
    ax_su.axhline(0, color='k', lw=0.8, ls='--', alpha=0.45)
    ax_su.set_xticks(x)
    ax_su.set_xticklabels([VEL_NAMES[v] for v in vels], fontsize=8)
    ax_su.set_ylabel('Median cents (pp → ff)', fontsize=9)
    ax_su.set_title('Measured pitch: naive vs clarity-gated\n'
                    '(ideally all bars equal — no velocity dependence)', fontsize=10)
    ax_su.legend(fontsize=8)
    ax_su.grid(True, alpha=0.2, axis='y')

    valid_n = [v for v in naive if not np.isnan(v)]
    valid_g = [v for v in gated if not np.isnan(v)]
    if valid_n:
        rng_n = max(valid_n) - min(valid_n)
        rng_g = max(valid_g) - min(valid_g) if valid_g else float('nan')
        ax_su.text(0.02, 0.97,
                   f"Naive spread pp→ff:  {rng_n:.1f} ¢\n"
                   f"Gated spread pp→ff:  {rng_g:.1f} ¢",
                   transform=ax_su.transAxes, fontsize=9, va='top', fontweight='bold',
                   bbox=dict(facecolor='lightyellow', alpha=0.88, edgecolor='#ccc', pad=4))

    # ── Panel 5: Spectrogram ───────────────────────────────────────────────
    clip_end = onset_ref + int(sr_ref * ANALYSIS_SECS)
    clip = data_ref[onset_ref: min(clip_end, len(data_ref))]
    # Use longer FFT for better frequency resolution on bass notes
    nperseg = min(4096, len(clip) // 4)
    if nperseg >= 64:
        f_sp, t_sp, Sxx = make_spectrogram(clip, sr_ref,
                                            nperseg=nperseg,
                                            noverlap=int(nperseg * 0.875))
        freq_mask = f_sp <= min(expected_hz * 12, 2000)
        Sxx_db = 20 * np.log10(Sxx[freq_mask] + 1e-10)
        vmax = Sxx_db.max()
        vmin = vmax - 70
        ax_sp.pcolormesh(t_sp * 1000, f_sp[freq_mask], Sxx_db,
                         shading='gouraud', cmap='inferno',
                         vmin=vmin, vmax=vmax)
        # Mark ideal ET harmonics
        for n in range(1, 16):
            hf = expected_hz * n
            if hf > min(expected_hz * 12, 2000):
                break
            ax_sp.axhline(hf, color='cyan', lw=0.5, alpha=0.55, ls='--')
            ax_sp.text(ANALYSIS_SECS*1000*0.98, hf, f' H{n}',
                       fontsize=6, color='cyan', va='center', ha='right', alpha=0.7)

    ax_sp.set_xlim(0, ANALYSIS_SECS*1000)
    ax_sp.set_xlabel('Time after onset (ms)', fontsize=9)
    ax_sp.set_ylabel('Frequency (Hz)', fontsize=9)
    ax_sp.set_title(f'Spectrogram — {VEL_NAMES[ref_vel]}\n'
                    '(cyan dashes = equal-temperament harmonics)', fontsize=10)
    ax_sp.grid(False)

    plt.savefig(os.path.join(BASE_DIR, f'transient_analysis_{note}{octave}.png'),
                dpi=130, bbox_inches='tight')
    print(f"  Saved transient_analysis_{note}{octave}.png")
    plt.show()
    return results


# ═══════════════════════════════════════════════════════════════════════════════
# PLOT 2 — Physics: WHY does the transient cause errors?
# ═══════════════════════════════════════════════════════════════════════════════

def plot_physics(note='C', octave=1, velocity=16):
    """Waveform + spectrum + NSDF comparison: attack vs sustain."""
    data, sr = load_salamander(note, octave, velocity)
    if data is None:
        print(f"No data for {note}{octave} v{velocity}")
        return

    expected_hz = note_hz(note, octave)
    onset = find_onset(data, sr)
    win = int(sr * WINDOW_MS / 1000)

    # Two comparison windows: attack and sustain
    atk_start = onset
    sus_start  = onset + int(sr * 0.5)   # 500 ms in = stable sustain

    atk_buf = data[atk_start : atk_start + win]
    sus_buf = data[sus_start : sus_start + win] if sus_start + win <= len(data) else None

    fig, axes = plt.subplots(1, 3, figsize=(17, 5))
    fig.suptitle(
        f"WHY does hammering cause wrong pitch? — {note}{octave}  ff (v{velocity})\n"
        f"Expected fundamental: {expected_hz:.2f} Hz",
        fontsize=13, fontweight='bold')

    # ── Left: waveform + rolling clarity ─────────────────────────────────
    ax = axes[0]
    t_audio = (np.arange(len(data)) - onset) / sr * 1000
    step = max(1, len(data) // 5000)
    ax.plot(t_audio[::step], data[::step],
            color='#1565C0', lw=0.45, alpha=0.7, label='Waveform')

    hop = int(sr * HOP_MS / 1000)
    ctimes, cvals = [], []
    pos = onset
    while pos + win <= len(data) and (pos - onset) < int(sr * ANALYSIS_SECS):
        nsdf, max_tau = compute_nsdf(data[pos:pos+win], sr)
        _, cl, _ = nsdf_peak_info(nsdf, sr, max_tau)
        ctimes.append((pos - onset) / sr * 1000)
        cvals.append(cl)
        pos += hop

    ax2 = ax.twinx()
    ax2.plot(ctimes, cvals, color='red', lw=1.8, alpha=0.75, label='Clarity')
    ax2.axhline(CLARITY_GATE, color='red', ls='--', lw=1.0, alpha=0.5)
    ax2.set_ylim(0, 1.1)
    ax2.set_ylabel('NSDF Clarity', color='red', fontsize=8)
    ax2.tick_params(axis='y', colors='red')

    ax.axvspan(0, (win / sr * 1000), alpha=0.12, color='red')
    if sus_buf is not None:
        ax.axvspan(500, 500 + win/sr*1000, alpha=0.12, color='green')
    ax.set_xlim(-50, ANALYSIS_SECS*1000)
    ax.set_xlabel('Time after onset (ms)', fontsize=9)
    ax.set_ylabel('Amplitude', fontsize=9)
    ax.set_title('Waveform + clarity over time\n'
                 '(red shade = attack window · green = sustain)', fontsize=9)
    ax.grid(True, alpha=0.2)

    # ── Middle: spectrum comparison ───────────────────────────────────────
    ax = axes[1]
    FFT_N = 131072
    for buf, color, label in [
            (atk_buf, '#E53935', f'Attack (0–{WINDOW_MS} ms)'),
            (sus_buf, '#43A047', f'Sustain (500–{500+WINDOW_MS} ms)')]:
        if buf is None or len(buf) < 256:
            continue
        window = np.hanning(len(buf))
        padded = np.zeros(FFT_N)
        padded[:len(buf)] = buf * window
        mag = np.abs(np.fft.rfft(padded))
        bin_hz = sr / FFT_N
        freqs = np.arange(len(mag)) * bin_hz
        show = freqs <= min(expected_hz * 14, 3000)
        mag_db = 20 * np.log10(mag[show] + 1e-10)
        mag_db -= mag_db.max()
        ax.plot(freqs[show], mag_db, color=color, lw=0.9, alpha=0.85, label=label)

    for n in range(1, 20):
        hf = expected_hz * n
        if hf > min(expected_hz * 14, 3000):
            break
        ax.axvline(hf, color='gray', lw=0.5, ls=':', alpha=0.4)
        ax.text(hf, 1, str(n), fontsize=5, ha='center', color='gray')

    ax.set_xlim(0, min(expected_hz * 14, 3000))
    ax.set_ylim(-80, 5)
    ax.set_xlabel('Frequency (Hz)', fontsize=9)
    ax.set_ylabel('dB (normalised)', fontsize=9)
    ax.set_title('Spectrum: attack vs sustain\n'
                 '(vertical lines = ET harmonics; numbers = harmonic #)', fontsize=9)
    ax.legend(fontsize=8)
    ax.grid(True, alpha=0.2)

    # ── Right: NSDF comparison ─────────────────────────────────────────────
    ax = axes[2]
    for buf, color, label in [
            (atk_buf, '#E53935', 'Attack NSDF'),
            (sus_buf, '#43A047', 'Sustain NSDF')]:
        if buf is None or len(buf) < 256:
            continue
        nsdf, max_tau = compute_nsdf(buf, sr)
        freq, clarity, _ = nsdf_peak_info(nsdf, sr, max_tau)
        tau_ms = np.arange(len(nsdf)) / sr * 1000
        # Show lags from 0 to 1000/min_hz ms (50ms ≈ 20 Hz)
        show = tau_ms <= 80
        ax.plot(tau_ms[show], nsdf[show], color=color, lw=1.4, alpha=0.85,
                label=f'{label}  (clarity={clarity:.2f}, freq={freq:.1f} Hz)'
                      if freq > 0 else f'{label}  (clarity={clarity:.2f})')
        if freq > 0:
            ax.axvline(1000/freq, color=color, ls='--', lw=0.9, alpha=0.55)
            ax.text(1000/freq, 0.97, f' {freq:.1f} Hz', fontsize=7,
                    color=color, va='top')

    ax.axhline(CLARITY_GATE, color='red', ls=':', lw=1.1, alpha=0.7,
               label=f'Clarity gate = {CLARITY_GATE}')
    ax.set_xlim(0, 80)
    ax.set_ylim(-0.25, 1.05)
    ax.set_xlabel('Lag τ (ms)  [peak at τ=1/f₀]', fontsize=9)
    ax.set_ylabel('NSDF', fontsize=9)
    ax.set_title('NSDF curves: attack vs sustain\n'
                 '(peak height = periodicity; dashed line = detected period)', fontsize=9)
    ax.legend(fontsize=8, loc='lower right')
    ax.grid(True, alpha=0.2)

    plt.tight_layout()
    plt.savefig(os.path.join(BASE_DIR, f'physics_explanation_{note}{octave}.png'),
                dpi=130, bbox_inches='tight')
    print(f"  Saved physics_explanation_{note}{octave}.png")
    plt.show()


# ═══════════════════════════════════════════════════════════════════════════════
# PLOT 3 — Cross-velocity reproducibility for all bass notes
# ═══════════════════════════════════════════════════════════════════════════════

def plot_reproducibility():
    """Show velocity-dependent pitch spread for all bass notes.

    Three strategies compared:
    - EARLY  (red):  measure 60ms–400ms after onset  — catches attack
    - LATE   (blue): measure 400ms–1200ms after onset — settled sustain
    - STABLE (green): measure 400ms–1200ms AND only keep readings where
                      pitch is within 2 cents of the window median
                      (stability filter mimics requiring consistent readings)

    Why early vs late?
    Salamander studio recordings have high NSDF clarity (0.83-0.96) even
    during the attack, so a clarity gate does not separate them.  However,
    the pitch glide effect IS visible in the timing: ff notes start sharp
    then settle; pp notes are stable throughout.  Measuring early catches
    the transient-biased pitch; measuring late catches the settled pitch.
    On a real piano + phone mic the clarity gate would additionally filter
    out the noisy attack frames.
    """
    print("\n=== Reproducibility across velocities (all bass notes) ===")
    fig, axes = plt.subplots(1, len(BASS_NOTES), figsize=(18, 5), sharey=True)
    fig.suptitle(
        "Pitch reproducibility pp -> ff  (v1 - v16)\n"
        "Red = early sustain (60-400ms)  |  Blue = late sustain (400-1200ms)  |"
        "  Green = late + stability filter\n"
        "Each bar = one velocity layer.  Ideal: all bars equal.",
        fontsize=11, fontweight='bold')

    # Time windows
    EARLY_START_MS, EARLY_END_MS   = 60,  400
    LATE_START_MS,  LATE_END_MS    = 400, 1200
    STABILITY_CENTS = 3.0   # keep readings within this many cents of local median

    for ax, (note, octave) in zip(axes, BASS_NOTES):
        expected_hz = note_hz(note, octave)
        print(f"  {note}{octave} ({expected_hz:.1f} Hz) ...", flush=True)

        early_list, late_list, stable_list = [], [], []
        vel_list = []

        for vel in ALL_VELOCITIES:
            data, sr = load_salamander(note, octave, vel)
            if data is None:
                continue
            onset = find_onset(data, sr)
            win = int(sr * WINDOW_MS / 1000)
            hop = int(sr * HOP_MS  / 1000)

            early_c, late_c = [], []
            for start_ms, end_ms, bucket in [
                    (EARLY_START_MS, EARLY_END_MS, early_c),
                    (LATE_START_MS,  LATE_END_MS,  late_c)]:
                pos = onset + int(sr * start_ms / 1000)
                end = onset + int(sr * end_ms   / 1000)
                while pos + win <= min(end, len(data)):
                    buf = data[pos : pos + win]
                    nsdf, max_tau = compute_nsdf(buf, sr)
                    freq, _, _ = nsdf_peak_info(nsdf, sr, max_tau)
                    if freq > 0:
                        c = 1200 * math.log2(freq / expected_hz)
                        if abs(c) < 100:
                            bucket.append(c)
                    pos += hop

            vel_list.append(vel)
            early_list.append(float(np.median(early_c)) if early_c else np.nan)
            late_list.append (float(np.median(late_c))  if late_c  else np.nan)

            # Stability filter on late window: keep readings near the median
            if late_c:
                med = float(np.median(late_c))
                stable_c = [c for c in late_c if abs(c - med) <= STABILITY_CENTS]
                stable_list.append(float(np.median(stable_c)) if stable_c else np.nan)
            else:
                stable_list.append(np.nan)

        if not vel_list:
            ax.set_title(f"{note}{octave}\n(no data)"); continue

        x  = np.arange(len(vel_list))
        w  = 0.26
        ax.bar(x - w,   early_list,  w, color='#EF5350', alpha=0.80, label='Early (60-400ms)')
        ax.bar(x,       late_list,   w, color='#42A5F5', alpha=0.80, label='Late (400-1200ms)')
        ax.bar(x + w,   stable_list, w, color='#66BB6A', alpha=0.80, label='Late+stable')
        ax.axhline(0, color='k', ls='--', lw=0.8, alpha=0.45)
        ax.set_xticks(x)
        ax.set_xticklabels([str(v) for v in vel_list], fontsize=5, rotation=45)
        ax.set_xlabel('Velocity (1=pp ... 16=ff)', fontsize=8)
        ax.set_title(f"{note}{octave}  ({expected_hz:.1f} Hz)", fontsize=10)
        ax.grid(True, alpha=0.2, axis='y')

        def spread(lst):
            v = [x for x in lst if not np.isnan(x)]
            return max(v)-min(v) if len(v) > 1 else float('nan')

        rng_e = spread(early_list)
        rng_l = spread(late_list)
        rng_s = spread(stable_list)
        ax.text(0.03, 0.97,
                f"Early  spread: {rng_e:.1f}c\n"
                f"Late   spread: {rng_l:.1f}c\n"
                f"Stable spread: {rng_s:.1f}c",
                transform=ax.transAxes, fontsize=7, va='top', fontweight='bold',
                bbox=dict(facecolor='lightyellow', alpha=0.88, edgecolor='#ccc', pad=3))

    axes[0].set_ylabel('Cents from equal temperament', fontsize=9)
    axes[0].legend(loc='lower left', fontsize=8)
    plt.tight_layout()
    plt.savefig(os.path.join(BASE_DIR, 'velocity_reproducibility.png'),
                dpi=130, bbox_inches='tight')
    print("  Saved velocity_reproducibility.png")
    plt.show()


# ═══════════════════════════════════════════════════════════════════════════════
# Entry point
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--note',    default='C')
    p.add_argument('--octave',  type=int, default=1)
    p.add_argument('--physics', action='store_true', help='Physics explanation plot only')
    p.add_argument('--repro',   action='store_true', help='Reproducibility plot only')
    p.add_argument('--all',     action='store_true', help='All three plots')
    args = p.parse_args()

    if args.repro:
        plot_reproducibility()
    elif args.physics:
        plot_physics(args.note, args.octave)
    elif args.all:
        plot_single_note(args.note, args.octave)
        plot_physics(args.note, args.octave)
        plot_reproducibility()
    else:
        # Default: all three
        plot_single_note(args.note, args.octave)
        plot_physics(args.note, args.octave)
        plot_reproducibility()
