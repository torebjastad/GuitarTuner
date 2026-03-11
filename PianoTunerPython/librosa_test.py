import os
import re
import numpy as np
import soundfile as sf
import math
import librosa

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

def run_tests():
    test_cases = []
    if os.path.exists(UIOWA_DIR):
        for f in os.listdir(UIOWA_DIR):
            if f.endswith('.ogg'):
                note, oct = parse_uiowa_filename(f)
                if note:
                    test_cases.append(('UIowa', os.path.join(UIOWA_DIR, f), note, oct, f"{note}{oct}"))
                    
    if os.path.exists(SALAMANDER_DIR):
        for f in os.listdir(SALAMANDER_DIR):
            if f.endswith('.ogg'):
                note, oct = parse_salamander_filename(f)
                if note:
                    test_cases.append(('Salamander', os.path.join(SALAMANDER_DIR, f), note, oct, f"{note}{oct}"))

    success = 0
    total = 0
    
    for dataset, filepath, note, octave, note_name in test_cases:
        expected_freq = calc_expected_freq(note, octave)
        data, sr = sf.read(filepath, always_2d=True)
        if data.shape[1] > 1:
            data = data.mean(axis=1)
        else:
            data = data[:, 0]
            
        start_idx = int(sr * 0.1)
        # Just use 8192 points ~ 0.17 seconds
        buffer_size = 8192
        if start_idx + buffer_size > len(data):
            start_idx = max(0, len(data) - buffer_size)
            
        buffer = data[start_idx : start_idx + buffer_size]
        
        # Test Librosa YIN
        # fmin=20, fmax=5000
        f0 = librosa.yin(buffer, fmin=20, fmax=5000, sr=sr, frame_length=4096)
        
        # Take the median of valid frames if any
        valid_f0 = f0[f0 > 0]
        if len(valid_f0) > 0:
            detected_freq = np.median(valid_f0)
            cents_off = 1200 * math.log(detected_freq / expected_freq) / math.log(2)
            if abs(cents_off) < 50:
                success += 1
            else:
                print(f"[{dataset}] {note_name} FAILED: Extracted {detected_freq:.1f} Hz (Expected {expected_freq:.1f} Hz), Off by {cents_off:.1f}c")
        else:
            print(f"[{dataset}] {note_name} FAILED: No frequency detected.")
            
        total += 1
        
    print(f"\nLibrosa YIN Test Result: {success}/{total} passed.")

if __name__ == "__main__":
    run_tests()
