import os, re, math, numpy as np, soundfile as sf
from ultimate_detector import UltimatePianoDetector

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEST_DATA_DIR = os.path.join(BASE_DIR, '..', 'TestData')
SALAMANDER_DIR = os.path.join(TEST_DATA_DIR, 'SalamanderGrandPianoV3_OggVorbis', 'ogg')
UIOWA_DIR = os.path.join(TEST_DATA_DIR, 'UIowa-Piano-mf')

SEMI = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3,
    "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8,
    "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11
}

def calc_expected_freq(note, octave):
    midi = (octave + 1) * 12 + SEMI[note]
    return 440.0 * (2 ** ((midi - 69) / 12))

def get_cents_tolerance(freq):
    if freq >= 2093: return 100
    if freq >= 1047: return 50
    return 25

det = UltimatePianoDetector()

# Test ALL Salamander files and report failures
failures = []
for f in sorted(os.listdir(SALAMANDER_DIR)):
    if not f.endswith('.ogg'): continue
    m = re.search(r'([A-Ga-g][b#]?)(\d)v(\d+)\.ogg$', f)
    if not m: continue
    note, octave, vel = m.group(1), int(m.group(2)), int(m.group(3))
    expected = calc_expected_freq(note, octave)
    tol = get_cents_tolerance(expected)

    data, sr = sf.read(os.path.join(SALAMANDER_DIR, f), always_2d=True)
    data = data[:, 0] if data.shape[1] == 1 else data.mean(axis=1)
    start = int(sr * 0.1)
    if start + 8192 > len(data): start = max(0, len(data) - 8192)
    buf = data[start:start+8192]

    freq, dbg = det.get_pitch(buf, sr, return_debug=True)
    if freq > 0:
        cents = 1200 * math.log2(freq / expected) / math.log(2)
    else:
        cents = -9999

    if abs(cents) >= tol:
        failures.append((f, note, octave, vel, expected, freq, cents, dbg))

print(f"Total failures: {len(failures)}")
for f, note, octave, vel, expected, freq, cents, dbg in failures:
    print(f"\n=== {f} === (expected {expected:.1f}Hz, got {freq:.1f}Hz, {cents:+.0f}c)")
    for l in dbg['decision_log']:
        print(f"  {l}")
    # Show harmonic peaks info
    if dbg.get('harmonic_peaks'):
        peak_freqs = [p[0] for p in dbg['harmonic_peaks']]
        print(f"  Harmonic peaks found: {[f'{p:.1f}' for p in peak_freqs[:20]]}")
    print(f"  MPM freq: {dbg['candidate_freq']:.1f}, w_peak: {dbg['w_peak_freq']:.1f}")
