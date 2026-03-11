import os
import re
import pytest
import soundfile as sf
import math
from mcleod_detector import McLeodDetector

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEST_DATA_DIR = os.path.join(BASE_DIR, '..', 'TestData')
UIOWA_DIR = os.path.join(TEST_DATA_DIR, 'UIowa-Piano-mf')
SALAMANDER_DIR = os.path.join(TEST_DATA_DIR, 'SalamanderGrandPianoV3_OggVorbis', 'ogg')

SEMI = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, 
    "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, 
    "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11
}
NOTE_STRINGS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

def get_note_info(frequency):
    if frequency <= 0:
        return None
    noteNum = 12 * (math.log(frequency / 440.0) / math.log(2))
    midi = int(round(noteNum)) + 69
    note = midi % 12
    name = NOTE_STRINGS[note]
    octave = (midi // 12) - 1
    
    desiredFreq = 440 * math.pow(2, (midi - 69) / 12)
    cents = 1200 * math.log(frequency / desiredFreq) / math.log(2)
    
    return f"{name}{octave}", cents

def calc_expected_freq(note, octave):
    midi = (octave + 1) * 12 + SEMI[note]
    return 440.0 * (2 ** ((midi - 69) / 12))

def parse_uiowa_filename(filename):
    # e.g., Piano.mf.B0.ogg
    match = re.search(r'Piano\.mf\.([A-Ga-g][b#]?)(\d)\.ogg$', filename)
    if match:
        return match.group(1), int(match.group(2))
    return None, None

def parse_salamander_filename(filename):
    # e.g., C1v8.ogg or F#2v8.ogg
    match = re.search(r'([A-Ga-g][b#]?)(\d)v\d\.ogg$', filename)
    if match:
        return match.group(1), int(match.group(2))
    return None, None

def discover_test_files():
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

    return test_cases

TEST_FILES = discover_test_files()
print(f"Discovered {len(TEST_FILES)} test files for piano tuning.")

@pytest.fixture(scope="module")
def detector():
    # Adjusted offset to ignore initial strike noise
    return McLeodDetector(cutoff=0.93, small_cutoff=0.5)

@pytest.mark.parametrize("dataset,filepath,note,octave,expected_note", TEST_FILES, ids=[f"{tc[0]}-{tc[4]}" for tc in TEST_FILES])
def test_piano_tuning(detector, dataset, filepath, note, octave, expected_note):
    expected_freq = calc_expected_freq(note, octave)
    
    # Read audio using soundfile
    data, samplerate = sf.read(filepath, always_2d=True)
    # Mix to mono if necessary
    if data.shape[1] > 1:
        data = data.mean(axis=1)
    else:
        data = data[:, 0]
        
    # Standard analyze offset - skipping first transient ms might help,
    # but let's test the first 4096 points + some offset initially, or
    # simulate what JS does (taking multiple frames and taking median smoothing).
    # Since we want a robust offline test, we can pass a window of audio 
    # We don't have a rigid window_size_exp for MPM, 
    # McLeod can natively perform well across larger buffers since it's just a lag calculation.
    # 8192 points is ~170ms, 4096 is ~85ms
    buffer_size = 8192
    
    start_idx = int(samplerate * 0.1)
    
    # Check if buffer fits
    if start_idx + buffer_size > len(data):
        start_idx = max(0, len(data) - buffer_size)
    
    buffer = data[start_idx : start_idx + buffer_size]
    
    freq = detector.get_pitch(buffer, samplerate)
    assert freq > 0, f"No frequency detected for {expected_note} in {dataset}"
    
    detected_info = get_note_info(freq)
    assert detected_info is not None
    detected_note, cents = detected_info
    
    # The absolute detected note must match
    assert detected_note == expected_note, f"Expected {expected_note} ({expected_freq:.1f} Hz) but got {detected_note} ({freq:.1f} Hz, {cents:.1f} c)"
    
    # Optional: ensure we are within 25 cents
    assert abs(cents) < 25, f"Pitch detection for {expected_note} is off by {cents:.1f} cents ({freq:.1f} Hz detected, expected {expected_freq:.1f} Hz)"
