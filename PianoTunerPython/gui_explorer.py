import os
import re
import math
import numpy as np
import soundfile as sf
import tkinter as tk
from tkinter import ttk

import sounddevice as sd

import matplotlib
matplotlib.use('TkAgg')
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.figure import Figure
from matplotlib.gridspec import GridSpec


from ultimate_detector import UltimatePianoDetector

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEST_DATA_DIR = os.path.join(BASE_DIR, '..', 'TestData')

SEMI = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3,
    "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8,
    "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11
}

NOTE_STRINGS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

# Standard guitar open string frequencies
GUITAR_STRINGS = {"e": ("E", 2), "a": ("A", 2), "d": ("D", 3), "g": ("G", 3), "b": ("B", 3), "e1st": ("E", 4)}

def calc_expected_freq(note, octave):
    midi = (octave + 1) * 12 + SEMI[note]
    return 440.0 * (2 ** ((midi - 69) / 12))

def get_note_name(freq):
    if freq <= 0:
        return "?"
    midi = 69 + 12 * math.log2(freq / 440.0)
    midi_round = int(round(midi))
    note = NOTE_STRINGS[midi_round % 12]
    octave = (midi_round // 12) - 1
    return f"{note}{octave}"

def get_cents_tolerance(expected_freq):
    """Octave-dependent tolerance to account for piano stretch tuning.
    Octave 6 (~1047-2093 Hz): +/-50 cents
    Octave 7+ (~2093+ Hz):    +/-100 cents
    All others:                +/-25 cents
    """
    if expected_freq >= 2093.0:    # C7 and above
        return 100
    elif expected_freq >= 1047.0:  # C6 and above
        return 50
    return 25

def parse_uiowa(filename):
    match = re.search(r'Piano\.mf\.([A-Ga-g][b#]?)(\d)\.ogg$', filename)
    if match: return match.group(1), int(match.group(2))
    return None, None

def parse_salamander(filename):
    match = re.search(r'([A-Ga-g][b#]?)(\d)v\d+\.ogg$', filename)
    if match: return match.group(1), int(match.group(2))
    return None, None

def parse_plucked_guitar(filename):
    match = re.search(r'__([a-g][#]?)(\d)\.wav$', filename)
    if match:
        note = match.group(1).upper()
        return note, int(match.group(2))
    return None, None

def parse_nylon_guitar(filename):
    match = re.search(r'clean_([a-g](?:1st)?)_str_(?:pick|pluck)\.wav$', filename)
    if match:
        string_key = match.group(1)
        if string_key in GUITAR_STRINGS:
            return GUITAR_STRINGS[string_key]
    return None, None

# Dataset definitions: (folder_name, subfolder, parser, file_extensions, display_name)
DATASET_DEFS = [
    ('UIowa-Piano-mf',                           None,  parse_uiowa,          ('.ogg',),       'UIowa'),
    ('SalamanderGrandPianoV3_OggVorbis',          'ogg', parse_salamander,     ('.ogg',),       'Salamander'),
    ('22511__skamos66__plucked-guitar-notes',     None,  parse_plucked_guitar, ('.wav',),       'Plucked'),
    ('Nylon-guitar-single-notes',                 None,  parse_nylon_guitar,   ('.wav',),       'Nylon'),
]

# Colors
BG_DARK = '#1e1e2f'
BG_PLOT = '#111118'
BG_LIST = '#2a2a3b'
CLR_PASS = '#34d399'
CLR_FAIL = '#f87171'
CLR_WARN = '#fbbf24'
CLR_TEXT = 'white'
CLR_MUTED = '#9ca3af'
CLR_BORDER = '#4b5563'
CLR_GRID = '#374151'
CLR_ACCENT = '#38bdf8'

class TuningGUI(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Ultimate Piano Detector Visualizer")
        self.geometry("1500x950")
        self.minsize(1200, 700)

        style = ttk.Style(self)
        style.theme_use('clam')
        style.configure('TFrame', background=BG_DARK)
        style.configure('TLabel', background=BG_DARK, foreground=CLR_TEXT)
        style.configure('Bold.TLabel', font=('Arial', 13, 'bold'), background=BG_DARK, foreground=CLR_ACCENT)
        style.configure('Summary.TLabel', font=('Consolas', 10), background=BG_DARK, foreground=CLR_MUTED)
        style.configure('TButton', font=('Arial', 10))

        self.configure(bg=BG_DARK)
        self.detector = UltimatePianoDetector()
        self.all_cases = []       # All loaded test cases
        self.filtered_cases = []  # Currently visible (filtered by checkboxes)
        self.results_cache = {}   # keyed by (dataset, path)
        self._load_datasets()

        # ---- Left Panel ----
        left_frame = ttk.Frame(self, width=280)
        left_frame.pack(side=tk.LEFT, fill=tk.Y, padx=(10, 5), pady=10)
        left_frame.pack_propagate(False)

        ttk.Label(left_frame, text="Datasets", font=('Arial', 12, 'bold')).pack(anchor=tk.W, pady=(0, 3))

        # Dataset checkboxes
        self.dataset_vars = {}
        cb_frame = ttk.Frame(left_frame)
        cb_frame.pack(fill=tk.X, pady=(0, 5))
        for ds_name in self.available_datasets:
            var = tk.BooleanVar(value=True)
            self.dataset_vars[ds_name] = var
            cb = tk.Checkbutton(cb_frame, text=ds_name, variable=var,
                                command=self._refresh_listbox,
                                bg=BG_DARK, fg=CLR_TEXT, selectcolor=BG_LIST,
                                activebackground=BG_DARK, activeforeground=CLR_TEXT,
                                font=('Consolas', 9), anchor='w')
            cb.pack(anchor=tk.W)

        self.summary_label = ttk.Label(left_frame, text="Click 'Run All' to test", style='Summary.TLabel')
        self.summary_label.pack(anchor=tk.W, pady=(0, 5))

        btn_frame = ttk.Frame(left_frame)
        btn_frame.pack(fill=tk.X, pady=(0, 5))
        self.run_all_btn = tk.Button(btn_frame, text="Run All", command=self._run_all_tests,
                                     bg='#3b82f6', fg='white', font=('Arial', 10, 'bold'),
                                     relief='flat', padx=10, pady=3, cursor='hand2')
        self.run_all_btn.pack(side=tk.LEFT)

        list_container = ttk.Frame(left_frame)
        list_container.pack(fill=tk.BOTH, expand=True)

        self.listbox = tk.Listbox(list_container, selectmode=tk.SINGLE, bg=BG_LIST, fg=CLR_TEXT,
                                  selectbackground='#3b82f6', borderwidth=0, highlightthickness=0,
                                  font=('Consolas', 10), activestyle='none')
        scrollbar = ttk.Scrollbar(list_container, orient="vertical", command=self.listbox.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.listbox.config(yscrollcommand=scrollbar.set)
        self.listbox.bind('<<ListboxSelect>>', self._on_select)

        self._refresh_listbox()

        # Keyboard navigation
        self.bind('<Up>', self._nav_up)
        self.bind('<Down>', self._nav_down)

        # ---- Middle Panel (Plots) ----
        mid_frame = ttk.Frame(self)
        mid_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5, pady=10)

        self.info_label = ttk.Label(mid_frame, text="Select a test case or press Up/Down arrows", style='Bold.TLabel')
        self.info_label.pack(pady=(0, 5))

        plt_kw = {'facecolor': BG_PLOT, 'edgecolor': BG_PLOT}
        self.figure = Figure(figsize=(9, 9), dpi=100, **plt_kw)

        # GridSpec: 3 rows x 2 cols
        #   row 0: waveform | NSDF
        #   row 1: raw FFT spectrum (full width)
        #   row 2: weighted spectrum | zoomed view
        self.gs = GridSpec(3, 2, figure=self.figure, hspace=0.45, wspace=0.25,
                          top=0.96, bottom=0.04, left=0.07, right=0.98,
                          height_ratios=[1, 1.2, 1])

        self.ax_wave = self.figure.add_subplot(self.gs[0, 0], facecolor=BG_PLOT)
        self.ax_nsdf = self.figure.add_subplot(self.gs[0, 1], facecolor=BG_PLOT)
        self.ax_raw = self.figure.add_subplot(self.gs[1, :], facecolor=BG_PLOT)
        self.ax_weighted = self.figure.add_subplot(self.gs[2, 0], facecolor=BG_PLOT)
        self.ax_zoom = self.figure.add_subplot(self.gs[2, 1], facecolor=BG_PLOT)

        self.canvas = FigureCanvasTkAgg(self.figure, mid_frame)
        self.canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)

        # Mouse wheel zoom on x-axis (centered on cursor position)
        self.canvas.mpl_connect('scroll_event', self._on_scroll_zoom)

        # ---- Right Panel (Decision Log) ----
        right_frame = ttk.Frame(self, width=340)
        right_frame.pack(side=tk.RIGHT, fill=tk.Y, padx=(5, 10), pady=10)
        right_frame.pack_propagate(False)

        ttk.Label(right_frame, text="Decision Engine", font=('Arial', 12, 'bold')).pack(anchor=tk.W, pady=(0, 5))

        self.log_text = tk.Text(right_frame, bg=BG_LIST, fg='#a78bfa', font=('Consolas', 10),
                                wrap=tk.WORD, borderwidth=0, highlightthickness=0, padx=10, pady=10)
        self.log_text.tag_configure('header', foreground=CLR_ACCENT, font=('Consolas', 10, 'bold'))
        self.log_text.tag_configure('pass', foreground=CLR_PASS)
        self.log_text.tag_configure('fail', foreground=CLR_FAIL)
        self.log_text.tag_configure('arrow', foreground=CLR_WARN, font=('Consolas', 10, 'bold'))
        self.log_text.pack(fill=tk.BOTH, expand=True)

    # ---------- Mouse wheel zoom ----------

    def _on_scroll_zoom(self, event):
        """Zoom x-axis only, centered on the mouse cursor position."""
        if event.inaxes is None:
            return
        ax = event.inaxes
        xdata = event.xdata
        if xdata is None:
            return

        scale_factor = 0.8 if event.button == 'up' else 1.25
        xlim = ax.get_xlim()

        # Compute new limits centered on mouse position
        left_frac = (xdata - xlim[0]) / (xlim[1] - xlim[0])
        new_width = (xlim[1] - xlim[0]) * scale_factor
        new_left = xdata - left_frac * new_width
        new_right = new_left + new_width

        ax.set_xlim(max(0, new_left), new_right)
        self.canvas.draw_idle()

    # ---------- Formatting ----------

    def _format_ax(self, ax, title):
        ax.set_title(title, color=CLR_TEXT, fontsize=10, fontweight='bold', pad=6)
        ax.tick_params(colors=CLR_MUTED, labelsize=8)
        for spine in ('bottom', 'left'):
            ax.spines[spine].set_color(CLR_BORDER)
        for spine in ('top', 'right'):
            ax.spines[spine].set_color(BG_PLOT)
        ax.grid(True, color=CLR_GRID, linestyle='--', alpha=0.4, zorder=0)

    def _vline(self, ax, x, **kwargs):
        kwargs.setdefault('zorder', 1)
        ax.axvline(x, **kwargs)

    def _hline(self, ax, y, **kwargs):
        kwargs.setdefault('zorder', 1)
        ax.axhline(y, **kwargs)

    # ---------- Data loading ----------

    def _load_datasets(self):
        cases = []
        found_datasets = []
        for folder_name, subfolder, parser, extensions, display_name in DATASET_DEFS:
            dirpath = os.path.join(TEST_DATA_DIR, folder_name)
            if subfolder:
                dirpath = os.path.join(dirpath, subfolder)
            if not os.path.exists(dirpath):
                continue
            found_datasets.append(display_name)
            for f in os.listdir(dirpath):
                if not any(f.endswith(ext) for ext in extensions):
                    continue
                result = parser(f)
                if result is None or result[0] is None:
                    continue
                note, oct_val = result
                expected = calc_expected_freq(note, oct_val)
                cases.append({
                    'dataset': display_name,
                    'path': os.path.join(dirpath, f),
                    'note_name': f"{note}{oct_val}",
                    'expected_freq': expected,
                })
        cases.sort(key=lambda x: x['expected_freq'])
        self.all_cases = cases
        self.available_datasets = found_datasets

    def _refresh_listbox(self):
        self.listbox.delete(0, tk.END)
        enabled = {name for name, var in self.dataset_vars.items() if var.get()}
        self.filtered_cases = [tc for tc in self.all_cases if tc['dataset'] in enabled]
        for tc in self.filtered_cases:
            self.listbox.insert(tk.END, f"[{tc['dataset'][:4]}] {tc['note_name']:>4} ({tc['expected_freq']:.1f}Hz)")
            # Restore cached pass/fail color
            cache_key = (tc['dataset'], tc['path'])
            if cache_key in self.results_cache:
                ok, _, _ = self.results_cache[cache_key]
                idx = self.listbox.size() - 1
                self.listbox.itemconfig(idx, fg=CLR_PASS if ok else CLR_FAIL)
        self.summary_label.config(text=f"{len(self.filtered_cases)} files shown")

    def _load_buffer(self, tc):
        data, sr = sf.read(tc['path'], always_2d=True)
        if data.shape[1] > 1:
            data = data.mean(axis=1)
        else:
            data = data[:, 0]

        buffer_size = 8192

        # Find note onset: scan RMS in 1024-sample hops, trigger at 10% of peak RMS
        hop = 1024
        scan_end = min(len(data) - hop, int(sr * 2))
        max_rms = 0
        for i in range(0, scan_end, hop):
            rms = np.sqrt(np.mean(data[i:i + hop] ** 2))
            if rms > max_rms:
                max_rms = rms

        onset_threshold = max_rms * 0.1
        onset_idx = 0
        for i in range(0, scan_end, hop // 2):
            rms = np.sqrt(np.mean(data[i:i + hop] ** 2))
            if rms > onset_threshold:
                onset_idx = i
                break

        # Start analysis slightly after onset to skip the initial transient
        start_idx = onset_idx + int(sr * 0.05)
        if start_idx + buffer_size > len(data):
            start_idx = max(0, len(data) - buffer_size)

        buffer = data[start_idx : start_idx + buffer_size]
        return buffer, sr

    # ---------- Navigation ----------

    def _nav_up(self, event):
        sel = self.listbox.curselection()
        idx = (sel[0] - 1) if sel else 0
        idx = max(0, idx)
        self.listbox.selection_clear(0, tk.END)
        self.listbox.selection_set(idx)
        self.listbox.see(idx)
        self.listbox.event_generate('<<ListboxSelect>>')

    def _nav_down(self, event):
        sel = self.listbox.curselection()
        idx = (sel[0] + 1) if sel else 0
        idx = min(len(self.filtered_cases) - 1, idx)
        self.listbox.selection_clear(0, tk.END)
        self.listbox.selection_set(idx)
        self.listbox.see(idx)
        self.listbox.event_generate('<<ListboxSelect>>')

    def _on_select(self, event):
        sel = self.listbox.curselection()
        if not sel or sel[0] >= len(self.filtered_cases):
            return
        self._analyze(self.filtered_cases[sel[0]])

    # ---------- Batch run ----------

    def _run_all_tests(self):
        self.run_all_btn.config(state='disabled', text='Running...')
        self.update_idletasks()

        passed = 0
        failed = 0
        for i, tc in enumerate(self.filtered_cases):
            buffer, sr = self._load_buffer(tc)
            freq = self.detector.get_pitch(buffer, sr)

            if freq > 0:
                cents = 1200 * math.log2(freq / tc['expected_freq'])
                tol = get_cents_tolerance(tc['expected_freq'])
                ok = abs(cents) <= tol
            else:
                ok = False
                cents = None

            cache_key = (tc['dataset'], tc['path'])
            self.results_cache[cache_key] = (ok, freq, cents)

            if ok:
                passed += 1
                self.listbox.itemconfig(i, fg=CLR_PASS)
            else:
                failed += 1
                self.listbox.itemconfig(i, fg=CLR_FAIL)

        total = passed + failed
        pct = (passed / total * 100) if total else 0
        self.summary_label.config(text=f"{passed}/{total} passed ({pct:.0f}%)  |  {failed} failed")
        self.run_all_btn.config(state='normal', text='Run All')

    # ---------- Audio playback ----------

    def _play_audio(self, tc):
        sd.stop()
        data, sr = sf.read(tc['path'], always_2d=False)
        sd.play(data, sr)

    # ---------- Analysis & plotting ----------

    def _analyze(self, tc):
        self._play_audio(tc)
        buffer, sr = self._load_buffer(tc)
        freq, debug_data = self.detector.get_pitch(buffer, sr, return_debug=True)
        expected = tc['expected_freq']

        for ax in (self.ax_wave, self.ax_nsdf, self.ax_raw, self.ax_weighted, self.ax_zoom):
            ax.clear()
        self.log_text.delete(1.0, tk.END)

        if freq < 0 or debug_data is None:
            self.info_label.config(text=f"[{tc['dataset']}] {tc['note_name']} - NO PITCH DETECTED", foreground=CLR_FAIL)
            self.canvas.draw()
            return

        cents = 1200 * math.log2(freq / expected)
        tol = get_cents_tolerance(expected)

        # ---- Decision log with formatting ----
        self.log_text.insert(tk.END, f"Expected: {tc['note_name']} ({expected:.1f} Hz)\n", 'header')
        self.log_text.insert(tk.END, f"Detected: {get_note_name(freq)} ({freq:.1f} Hz)\n", 'header')
        self.log_text.insert(tk.END, f"Error: {cents:+.1f} cents (tol: +/-{tol}c)\n\n",
                             'pass' if abs(cents) <= tol else 'fail')

        for line in debug_data.get('decision_log', []):
            if '->' in line:
                self.log_text.insert(tk.END, line + "\n\n", 'arrow')
            else:
                self.log_text.insert(tk.END, line + "\n\n")

        # ---- Common data ----
        bin_hz = debug_data['bin_hz']
        mag = debug_data['mag']
        freqs = np.arange(len(mag)) * bin_hz
        mpm_freq = debug_data['candidate_freq']
        w_peak_freq = debug_data.get('w_peak_freq', 0)
        h_peaks = debug_data.get('harmonic_peaks', [])
        h_peak_freqs = [p[0] for p in h_peaks] if h_peaks else []

        # Auto-fit x-axis to include all relevant peaks
        key_freqs = [expected, freq, mpm_freq, w_peak_freq] + h_peak_freqs
        key_freqs = [f for f in key_freqs if f > 0]
        max_f_display = min(10000, max(key_freqs) * 1.15 + 200) if key_freqs else 5000
        max_bin = int(max_f_display / bin_hz)

        # ---- Plot 1: Waveform ----
        self._format_ax(self.ax_wave, "Waveform (analysis window)")
        time_ms = np.arange(len(buffer)) / sr * 1000
        self.ax_wave.plot(time_ms, buffer, color='#60a5fa', linewidth=0.6, zorder=3)
        self.ax_wave.set_xlim(0, min(40, time_ms[-1]))
        self.ax_wave.set_xlabel("Time (ms)", color=CLR_MUTED, fontsize=8)
        self.ax_wave.set_ylabel("Amplitude", color=CLR_MUTED, fontsize=8)

        # ---- Plot 2: NSDF ----
        nsdf = debug_data['nsdf']
        threshold = debug_data['threshold']
        lags = np.arange(len(nsdf))

        self._format_ax(self.ax_nsdf, "McLeod NSDF")
        self.ax_nsdf.plot(lags, nsdf, color='#8b5cf6', linewidth=1.2, zorder=3)
        self._hline(self.ax_nsdf, threshold, color='#f43f5e', linestyle='--', alpha=0.7,
                    label=f'Threshold ({threshold:.2f})')

        km = debug_data['key_maxima']
        if km:
            km_lags, km_vals = zip(*km)
            self.ax_nsdf.scatter(km_lags, km_vals, color=CLR_WARN, s=25, zorder=5, label='Key maxima')

        mpm_tau = debug_data['selected_tau']
        if mpm_tau:
            self._vline(self.ax_nsdf, mpm_tau, color=CLR_PASS, linestyle=':', alpha=0.8,
                        label=f'Selected tau: {mpm_tau}')

        # Auto-scale to show at least the selected tau + 15% margin, or 400 minimum
        if mpm_tau:
            max_lag_display = min(len(nsdf), int(mpm_tau * 1.15))
        else:
            max_lag_display = min(len(nsdf), 400)
        max_lag_display = max(max_lag_display, 100)
        self.ax_nsdf.set_xlim(0, max_lag_display)
        self.ax_nsdf.set_xlabel("Lag (samples)", color=CLR_MUTED, fontsize=8)
        self.ax_nsdf.legend(loc='lower right', facecolor=BG_PLOT, edgecolor=CLR_GRID,
                            labelcolor=CLR_TEXT, fontsize=8)

        # ---- Plot 3: Raw FFT Spectrum (full width) ----
        self._format_ax(self.ax_raw, "FFT Magnitude Spectrum")
        self.ax_raw.plot(freqs[:max_bin], mag[:max_bin], color='#06b6d4', linewidth=1.0, zorder=3)

        self._vline(self.ax_raw, expected, color='#60a5fa', linestyle='-.', alpha=0.6,
                    label=f'Expected: {expected:.1f}Hz')
        self._vline(self.ax_raw, mpm_freq, color=CLR_PASS, linestyle='--', alpha=0.6,
                    label=f'MPM: {mpm_freq:.1f}Hz')
        if w_peak_freq > 0:
            self._vline(self.ax_raw, w_peak_freq, color='#f43f5e', linestyle='--', alpha=0.6,
                        label=f'Weighted peak: {w_peak_freq:.1f}Hz')
        self._vline(self.ax_raw, freq, color=CLR_WARN, linestyle='-', linewidth=1.5, alpha=0.8,
                    label=f'Final: {freq:.1f}Hz')

        # Mark detected harmonic peaks
        if h_peak_freqs:
            h_peak_mags = [mag[min(len(mag)-1, int(round(f / bin_hz)))] for f in h_peak_freqs]
            self.ax_raw.scatter(h_peak_freqs, h_peak_mags, color='#f472b6', marker='v', s=30,
                                zorder=6, label=f'Harmonic peaks ({len(h_peak_freqs)})')

        self.ax_raw.set_yscale('log')
        self.ax_raw.set_xlim(0, max_f_display)
        self.ax_raw.set_xlabel("Frequency (Hz)", color=CLR_MUTED, fontsize=8)
        self.ax_raw.legend(loc='upper right', facecolor=BG_PLOT, edgecolor=CLR_GRID,
                           labelcolor=CLR_TEXT, fontsize=8, ncol=2)

        # ---- Plot 4: Weighted Spectrum ----
        weighted_mag = debug_data.get('weighted_mag', np.array([]))
        w_min_bin = debug_data.get('min_bin', 0)
        w_freqs = np.arange(len(weighted_mag)) * bin_hz + (w_min_bin * bin_hz)

        self._format_ax(self.ax_weighted, "Frequency-Weighted Spectrum")
        mask = w_freqs < max_f_display
        if np.any(mask):
            self.ax_weighted.plot(w_freqs[mask], weighted_mag[mask], color='#10b981', linewidth=1.0, zorder=3)

        self._vline(self.ax_weighted, expected, color='#60a5fa', linestyle='-.', alpha=0.6,
                    label=f'Expected: {expected:.1f}Hz')
        if w_peak_freq > 0:
            self._vline(self.ax_weighted, w_peak_freq, color='#f43f5e', linestyle='--', alpha=0.6,
                        label=f'Weighted peak: {w_peak_freq:.1f}Hz')
        self._vline(self.ax_weighted, freq, color=CLR_WARN, linestyle='-', linewidth=1.5, alpha=0.8,
                    label=f'Final: {freq:.1f}Hz')

        # Mark detected harmonic peaks on weighted spectrum
        if h_peak_freqs:
            w_min = debug_data.get('min_bin', 0)
            h_peak_w_vals = []
            for hf in h_peak_freqs:
                w_idx = int(round(hf / bin_hz)) - w_min
                if 0 <= w_idx < len(weighted_mag):
                    h_peak_w_vals.append(weighted_mag[w_idx])
                else:
                    h_peak_w_vals.append(0)
            self.ax_weighted.scatter(h_peak_freqs, h_peak_w_vals, color='#f472b6', marker='v', s=30,
                                     zorder=6, label=f'Harmonic peaks ({len(h_peak_freqs)})')

        self.ax_weighted.set_xlim(0, max_f_display)
        self.ax_weighted.set_xlabel("Frequency (Hz)", color=CLR_MUTED, fontsize=8)
        self.ax_weighted.legend(loc='upper right', facecolor=BG_PLOT, edgecolor=CLR_GRID,
                                labelcolor=CLR_TEXT, fontsize=8)

        # ---- Plot 5: Zoomed FFT around detected frequency ----
        zoom_halfwidth = max(freq * 0.08, 15)
        zoom_lo = max(0, freq - zoom_halfwidth)
        zoom_hi = freq + zoom_halfwidth
        zoom_lo_bin = max(0, int(zoom_lo / bin_hz))
        zoom_hi_bin = min(len(mag) - 1, int(zoom_hi / bin_hz))

        self._format_ax(self.ax_zoom, "Zoomed: Detected Frequency")
        self.ax_zoom.plot(freqs[zoom_lo_bin:zoom_hi_bin], mag[zoom_lo_bin:zoom_hi_bin],
                          color='#06b6d4', linewidth=1.5, zorder=3)

        self._vline(self.ax_zoom, expected, color='#60a5fa', linestyle='-.', alpha=0.7,
                    label=f'Expected: {expected:.1f}Hz')
        self._vline(self.ax_zoom, freq, color=CLR_WARN, linestyle='-', linewidth=2, alpha=0.9,
                    label=f'Detected: {freq:.1f}Hz')

        # Shade the +/-5 cent "in tune" zone
        in_tune_lo = expected * 2**(-5/1200)
        in_tune_hi = expected * 2**(5/1200)
        self.ax_zoom.axvspan(in_tune_lo, in_tune_hi, alpha=0.12, color=CLR_PASS, zorder=0,
                             label='+/-5 cents')

        self.ax_zoom.set_xlim(zoom_lo, zoom_hi)
        self.ax_zoom.set_xlabel("Frequency (Hz)", color=CLR_MUTED, fontsize=8)
        self.ax_zoom.legend(loc='upper right', facecolor=BG_PLOT, edgecolor=CLR_GRID,
                            labelcolor=CLR_TEXT, fontsize=8)

        self.canvas.draw()

        # ---- Info label ----
        ok = abs(cents) <= tol
        status = "PASSED" if ok else "FAILED"
        color = CLR_PASS if ok else CLR_FAIL
        self.info_label.config(
            text=f"[{tc['dataset']}] {tc['note_name']}  |  Detected: {freq:.2f}Hz  (Expected: {expected:.2f}Hz)  |  {cents:+.1f} cents  |  tol: +/-{tol}c  |  {status}",
            foreground=color
        )


if __name__ == "__main__":
    app = TuningGUI()
    app.mainloop()
