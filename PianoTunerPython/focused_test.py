"""Focused test: UIowa full dataset + Salamander v8 + Kamoe piano."""
import os, re, math
import numpy as np
import soundfile as sf
from ultimate_detector import UltimatePianoDetector

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEST_DATA_DIR = os.path.join(BASE_DIR, '..', 'TestData')
UIOWA_DIR = os.path.join(TEST_DATA_DIR, 'UIowa-Piano-mf')
SALAMANDER_DIR = os.path.join(TEST_DATA_DIR, 'SalamanderGrandPianoV3_OggVorbis', 'ogg')
KAMOE_DIR = os.path.join(TEST_DATA_DIR, 'kamoepiano301', 'samples')

SEMI = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3,
    "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8,
    "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11
}

def calc_expected_freq(note, octave):
    midi = (octave + 1) * 12 + SEMI[note]
    return 440.0 * (2 ** ((midi - 69) / 12))

def get_cents_tolerance(freq):
    if freq >= 2093: return 100  # C7+
    if freq >= 1047: return 50   # C6+
    if freq < 65.5:  return 35   # A0-C1 (high inharmonicity)
    return 25

def find_onset(data, sr, hop=1024, threshold_ratio=0.1):
    """RMS-based onset detection."""
    rms_vals = []
    for i in range(0, len(data) - hop, hop):
        chunk = data[i:i+hop]
        rms_vals.append(np.sqrt(np.mean(chunk**2)))
    if not rms_vals:
        return 0
    peak_rms = max(rms_vals)
    threshold = peak_rms * threshold_ratio
    for i, rms in enumerate(rms_vals):
        if rms > threshold:
            onset_sample = i * hop + int(sr * 0.05)  # 50ms past onset
            return min(onset_sample, len(data) - 8192)
    return 0

def run_tests():
    test_cases = []

    # UIowa - all files
    if os.path.exists(UIOWA_DIR):
        for f in os.listdir(UIOWA_DIR):
            if f.endswith('.ogg'):
                m = re.search(r'Piano\.mf\.([A-Ga-g][b#]?)(\d)\.ogg$', f)
                if m:
                    test_cases.append(('UIowa', os.path.join(UIOWA_DIR, f), m.group(1), int(m.group(2)), f"{m.group(1)}{m.group(2)}"))

    # Salamander - v8 only (middle velocity)
    if os.path.exists(SALAMANDER_DIR):
        for f in os.listdir(SALAMANDER_DIR):
            if f.endswith('.ogg') and 'v8' in f:
                m = re.search(r'([A-Ga-g][b#]?)(\d)v8\.ogg$', f)
                if m:
                    test_cases.append(('Salamander-v8', os.path.join(SALAMANDER_DIR, f), m.group(1), int(m.group(2)), f"{m.group(1)}{m.group(2)}"))

    # Kamoe piano - all files
    if os.path.exists(KAMOE_DIR):
        for f in os.listdir(KAMOE_DIR):
            if f.endswith('.wav'):
                m = re.search(r'(?:f|mf|p)_(?:hb_|hc_|lc_)?([a-g]#?)(\d)\.wav$', f)
                if m:
                    note = m.group(1).upper()
                    test_cases.append(('Kamoe', os.path.join(KAMOE_DIR, f), note, int(m.group(2)), f"{note}{m.group(2)}"))

    test_cases.sort(key=lambda t: calc_expected_freq(t[2], t[3]))
    detector = UltimatePianoDetector()

    success = 0
    total = 0
    failures = []

    for dataset, filepath, note, octave, note_name in test_cases:
        expected_freq = calc_expected_freq(note, octave)
        tolerance = get_cents_tolerance(expected_freq)
        data, sr = sf.read(filepath, always_2d=True)
        if data.shape[1] > 1:
            data = data.mean(axis=1)
        else:
            data = data[:, 0]

        # Use onset detection for UIowa (long silence before note)
        if dataset == 'UIowa':
            start_idx = find_onset(data, sr)
        else:
            start_idx = int(sr * 0.1)

        buffer_size = 8192
        if start_idx + buffer_size > len(data):
            start_idx = max(0, len(data) - buffer_size)
        buf = data[start_idx : start_idx + buffer_size]

        freq = detector.get_pitch(buf, sr)

        if freq > 0:
            cents_off = 1200 * math.log(freq / expected_freq) / math.log(2)
            if abs(cents_off) < tolerance:
                success += 1
            else:
                failures.append(f"[{dataset}] {note_name} FAIL: {freq:.1f}Hz (exp {expected_freq:.1f}Hz), {cents_off:+.0f}c (tol ±{tolerance}c)")
        else:
            failures.append(f"[{dataset}] {note_name} FAIL: No freq detected (exp {expected_freq:.1f}Hz)")

        total += 1

    print("\n--- Failures ---")
    for f in failures:
        print(f)
    print(f"\nResult: {success}/{total} passed.")

if __name__ == "__main__":
    run_tests()
