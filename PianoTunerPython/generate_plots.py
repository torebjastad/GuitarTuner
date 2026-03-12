import os
import math
import numpy as np
import soundfile as sf
import matplotlib.pyplot as plt
from ultimate_detector import UltimatePianoDetector

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEST_DATA_DIR = os.path.join(BASE_DIR, '..', 'TestData')
SALAMANDER_DIR = os.path.join(TEST_DATA_DIR, 'SalamanderGrandPianoV3_OggVorbis', 'ogg')

def create_diagnosis_plot(filename, expected_freq):
    filepath = os.path.join(SALAMANDER_DIR, filename)
    data, sr = sf.read(filepath, always_2d=True)
    if data.shape[1] > 1:
        data = data.mean(axis=1)
    else:
        data = data[:, 0]
        
    start_idx = int(sr * 0.1)
    buffer_size = 8192
    if start_idx + buffer_size > len(data):
        start_idx = max(0, len(data) - buffer_size)
    buffer = data[start_idx : start_idx + buffer_size]

    detector = UltimatePianoDetector()
    freq, debug_data = detector.get_pitch(buffer, sr, return_debug=True)
    
    fig, axs = plt.subplots(3, 1, figsize=(12, 10))
    fig.suptitle(f"Diagnosis for {filename} (Expected {expected_freq:.1f}Hz, Detected: {freq:.1f}Hz)", fontsize=16)
    
    # 1. Raw Waveform
    axs[0].plot(np.arange(len(buffer)) / sr * 1000, buffer, color='#3b82f6')
    axs[0].set_title("Raw Waveform (zoom to first 40ms)")
    axs[0].set_xlim(0, 40)
    axs[0].set_xlabel("Time (ms)")
    axs[0].set_ylabel("Amplitude")
    
    # 2. NSDF
    nsdf = debug_data['nsdf'] if debug_data else []
    lags = np.arange(len(nsdf))
    if len(nsdf) > 0:
        axs[1].plot(lags, nsdf, color='#8b5cf6')
        threshold = debug_data['threshold']
        axs[1].axhline(threshold, color='#f43f5e', linestyle='--', label='Threshold')
        km = debug_data['key_maxima']
        if km:
            km_lags, km_vals = zip(*km)
            axs[1].scatter(km_lags, km_vals, color='orange', s=20, label='Key Maxima')
        if debug_data['selected_tau'] is not None:
             axs[1].axvline(debug_data['selected_tau'], color='green', linestyle=':', label='MPM Selected Tau')
    axs[1].set_title("Normalized Square Difference Function (NSDF)")
    axs[1].set_xlim(0, 100) # zoom into highest frequencies
    axs[1].legend()
    
    # 3. FFT Magnitude
    if debug_data and 'mag' in debug_data:
        mag = debug_data['mag']
        bin_hz = debug_data['bin_hz']
        freqs = np.arange(len(mag)) * bin_hz
        max_f_display = 12000
        max_bin = int(max_f_display / bin_hz)
        
        axs[2].plot(freqs[:max_bin], mag[:max_bin], color='#10b981')
        axs[2].axvline(expected_freq, color='blue', linestyle='-.', label=f'Expected: {expected_freq:.1f}Hz')
        if debug_data['candidate_freq'] > 0:
            axs[2].axvline(debug_data['candidate_freq'], color='gray', linestyle='--', label=f"MPM Raw: {debug_data['candidate_freq']:.1f}Hz")
        if debug_data['best_freq'] > 0 and debug_data['best_freq'] != debug_data['candidate_freq']:
            axs[2].axvline(debug_data['best_freq'], color='red', linestyle='-', label=f"Hybrid Upgrade: {debug_data['best_freq']:.1f}Hz")
            
        # Also plot a massive raw FFT (same as we did to get mag) but with log y-axis to see details
        axs[2].set_yscale('log')
        axs[2].set_title("FFT Magnitude Spectrum (Log Scale)")
        axs[2].set_xlabel("Frequency (Hz)")
        axs[2].legend()
    
    plt.tight_layout()
    plt.savefig('diagnosis_C8.png', dpi=150)
    print("Saved diagnosis_C8.png")

if __name__ == "__main__":
    create_diagnosis_plot('C8v5.ogg', 4186.0)
