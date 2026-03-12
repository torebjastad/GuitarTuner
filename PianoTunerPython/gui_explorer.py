import os
import re
import math
import numpy as np
import soundfile as sf
import tkinter as tk
from tkinter import ttk

import matplotlib
matplotlib.use('TkAgg')
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.figure import Figure

from ultimate_detector import UltimatePianoDetector

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEST_DATA_DIR = os.path.join(BASE_DIR, '..', 'TestData')
UIOWA_DIR = os.path.join(TEST_DATA_DIR, 'UIowa-Piano-mf')
SALAMANDER_DIR = os.path.join(TEST_DATA_DIR, 'SalamanderGrandPianoV3_OggVorbis', 'ogg')

SEMI = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, 
    "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, 
    "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11
}

def calc_expected_freq(note, octave):
    midi = (octave + 1) * 12 + SEMI[note]
    return 440.0 * (2 ** ((midi - 69) / 12))

def parse_uiowa_filename(filename):
    match = re.search(r'Piano\.mf\.([A-Ga-g][b#]?)(\d)\.ogg$', filename)
    if match: return match.group(1), int(match.group(2))
    return None, None

def parse_salamander_filename(filename):
    match = re.search(r'([A-Ga-g][b#]?)(\d)v\d\.ogg$', filename)
    if match: return match.group(1), int(match.group(2))
    return None, None

class TuningGUI(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Ultimate Piano Detector Explorer")
        self.geometry("1000x800")
        
        self.detector = UltimatePianoDetector()
        
        self.test_cases = []
        self._load_datasets()
        
        # UI Setup
        left_frame = ttk.Frame(self, width=250)
        left_frame.pack(side=tk.LEFT, fill=tk.Y, padx=5, pady=5)
        
        right_frame = ttk.Frame(self)
        right_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)
        
        # Listbox for files
        ttk.Label(left_frame, text="Select Test Audio:").pack(anchor=tk.W)
        self.listbox = tk.Listbox(left_frame, selectmode=tk.SINGLE)
        self.listbox.pack(fill=tk.BOTH, expand=True)
        self.listbox.bind('<<ListboxSelect>>', self.on_select)
        
        # Populate Listbox
        for tc in self.test_cases:
            self.listbox.insert(tk.END, f"[{tc['dataset']}] {tc['note_name']} ({tc['expected_freq']:.1f}Hz)")
            
        # Top right label
        self.info_label = ttk.Label(right_frame, text="Select a test case to analyze", font=('Arial', 12, 'bold'))
        self.info_label.pack(pady=10)
        
        # Matplotlib Figure
        self.figure = Figure(figsize=(8, 6), dpi=100)
        self.ax_nsdf = self.figure.add_subplot(211)
        self.ax_spec = self.figure.add_subplot(212)
        
        self.canvas = FigureCanvasTkAgg(self.figure, right_frame)
        self.canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)

    def _load_datasets(self):
        cases = []
        if os.path.exists(UIOWA_DIR):
            for f in os.listdir(UIOWA_DIR):
                if f.endswith('.ogg'):
                    note, oct_val = parse_uiowa_filename(f)
                    if note:
                        expected = calc_expected_freq(note, oct_val)
                        cases.append({
                            'dataset': 'UIowa', 'path': os.path.join(UIOWA_DIR, f), 
                            'note_name': f"{note}{oct_val}", 'expected_freq': expected
                        })
                        
        if os.path.exists(SALAMANDER_DIR):
            for f in os.listdir(SALAMANDER_DIR):
                if f.endswith('.ogg'):
                    note, oct_val = parse_salamander_filename(f)
                    if note:
                        expected = calc_expected_freq(note, oct_val)
                        cases.append({
                            'dataset': 'Salamander', 'path': os.path.join(SALAMANDER_DIR, f), 
                            'note_name': f"{note}{oct_val}", 'expected_freq': expected
                        })
        
        cases.sort(key=lambda x: x['expected_freq'])
        self.test_cases = cases

    def on_select(self, event):
        selection = self.listbox.curselection()
        if not selection:
            return
        index = selection[0]
        tc = self.test_cases[index]
        self.analyze_file(tc)

    def analyze_file(self, tc):
        data, sr = sf.read(tc['path'], always_2d=True)
        if data.shape[1] > 1:
            data = data.mean(axis=1)
        else:
            data = data[:, 0]
            
        start_idx = int(sr * 0.1)
        buffer_size = 8192
        if start_idx + buffer_size > len(data):
            start_idx = max(0, len(data) - buffer_size)
            
        buffer = data[start_idx : start_idx + buffer_size]
        
        freq, debug_data = self.detector.get_pitch(buffer, sr, return_debug=True)
        
        self.ax_nsdf.clear()
        self.ax_spec.clear()
        
        if freq < 0 or debug_data is None:
            self.info_label.config(text=f"[{tc['dataset']}] {tc['note_name']} - Failed to detect pitch")
            self.canvas.draw()
            return
            
        # Draw NSDF
        nsdf = debug_data['nsdf']
        key_maxima = debug_data['key_maxima']
        threshold = debug_data['threshold']
        
        lags = np.arange(len(nsdf))
        self.ax_nsdf.plot(lags, nsdf, color='#3b82f6', label='NSDF')
        self.ax_nsdf.axhline(threshold, color='#f43f5e', linestyle='--', label=f'Threshold ({threshold:.2f})')
        
        # Plot key maxima
        if key_maxima:
            km_lags, km_vals = zip(*key_maxima)
            self.ax_nsdf.scatter(km_lags, km_vals, color='orange', s=20, label='Key Maxima', zorder=5)
            
        self.ax_nsdf.axvline(debug_data['selected_tau'], color='green', linestyle=':', label='MPM Selected Tau')
        
        self.ax_nsdf.set_title(f"NSDF (McLeod Peak Selection)")
        self.ax_nsdf.set_xlabel("Lag (samples)")
        self.ax_nsdf.set_ylabel("Correlation")
        self.ax_nsdf.legend()
        
        # Draw Spectrum
        mag = debug_data['mag']
        bin_hz = debug_data['bin_hz']
        freqs = np.arange(len(mag)) * bin_hz
        
        max_f_display = min(tc['expected_freq'] * 5 + 1000, 10000)
        max_bin = int(max_f_display / bin_hz)
        
        self.ax_spec.plot(freqs[:max_bin], mag[:max_bin], color='#10b981', label='Magnitude')
        
        c_freq = debug_data['candidate_freq']
        b_freq = debug_data['best_freq']
        
        self.ax_spec.axvline(c_freq, color='gray', linestyle='--', label=f'MPM Raw: {c_freq:.1f}Hz')
        
        if c_freq != b_freq:
            self.ax_spec.axvline(b_freq, color='#ef4444', linestyle='-', linewidth=2, label=f'Hybrid Upgrade: {b_freq:.1f}Hz')
            
        self.ax_spec.axvline(tc['expected_freq'], color='blue', linestyle='-.', label=f"Target: {tc['expected_freq']:.1f}Hz")
        
        self.ax_spec.set_title("Spectral Power Verification (Hybrid Pitch Upgrading)")
        self.ax_spec.set_xlabel("Frequency (Hz)")
        self.ax_spec.set_ylabel("Magnitude")
        self.ax_spec.legend()
        
        self.figure.tight_layout()
        self.canvas.draw()
        
        cents = 1200 * math.log(freq / tc['expected_freq']) / math.log(2)
        status = "PASSED" if abs(cents) <= 25 else "FAILED"
        self.info_label.config(
            text=f"[{tc['dataset']}] {tc['note_name']} | Detected: {freq:.2f}Hz | Expected: {tc['expected_freq']:.2f}Hz | Error: {cents:.1f} cents | {status}"
        )

if __name__ == "__main__":
    app = TuningGUI()
    app.mainloop()
