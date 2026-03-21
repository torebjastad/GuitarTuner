"""Comprehensive test for KeySpecificDetector across all available piano datasets."""
import os, re, math, time, sys
import numpy as np
import soundfile as sf
from key_specific_detector import KeySpecificDetector

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEST_DATA_DIR = os.path.join(BASE_DIR, '..', 'TestData')

SEMI = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3,
    "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8,
    "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11
}

def calc_expected_freq(note, octave):
    midi = (octave + 1) * 12 + SEMI[note]
    return 440.0 * (2 ** ((midi - 69) / 12))

def get_cents_tolerance(freq):
    """Register-dependent tolerance (same as focused_test.py for comparison)."""
    if freq >= 2093: return 100   # C7+
    if freq >= 1047: return 50    # C6+
    if freq < 65.5:  return 35    # A0-C1
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
            return min(onset_sample, max(0, len(data) - 8192))
    return 0

def discover_datasets():
    """Discover all piano datasets in TestData."""
    datasets = []

    # --- Original 6 datasets from focused_test.py ---

    # UIowa
    d = os.path.join(TEST_DATA_DIR, 'UIowa-Piano-mf')
    if os.path.exists(d):
        for f in os.listdir(d):
            m = re.search(r'Piano\.mf\.([A-Ga-g][b#]?)(\d)\.ogg$', f)
            if m:
                datasets.append(('UIowa', os.path.join(d, f), m.group(1), int(m.group(2))))

    # Salamander v8
    d = os.path.join(TEST_DATA_DIR, 'SalamanderGrandPianoV3_OggVorbis', 'ogg')
    if os.path.exists(d):
        for f in os.listdir(d):
            m = re.search(r'([A-Ga-g][b#]?)(\d)v8\.ogg$', f)
            if m:
                datasets.append(('Salamander', os.path.join(d, f), m.group(1), int(m.group(2))))

    # Kamoe
    d = os.path.join(TEST_DATA_DIR, 'kamoepiano301', 'samples')
    if os.path.exists(d):
        for f in os.listdir(d):
            m = re.search(r'(?:f|mf|p)_(?:hb_|hc_|lc_)?([a-g]#?)(\d)\.wav$', f)
            if m:
                note = m.group(1).upper()
                datasets.append(('Kamoe', os.path.join(d, f), note, int(m.group(2))))

    # DK Gentle Grand (octave +1)
    d = os.path.join(TEST_DATA_DIR, 'DK Gentle Grand', 'Samples', 'Clean NR')
    if os.path.exists(d):
        for f in os.listdir(d):
            m = re.search(r'FSS6_Royers_L1_([A-G]#?)(\d)_RR1\.wav$', f)
            if m:
                datasets.append(('DK-Gentle', os.path.join(d, f), m.group(1), int(m.group(2)) + 1))

    # Legacy Knight (octave +1)
    d = os.path.join(TEST_DATA_DIR, 'Legacy Knight 1.0 (DS)', 'Samples')
    if os.path.exists(d):
        for f in os.listdir(d):
            if 'Pad' in f:
                continue
            m = re.search(r'^\d+\s+([A-G]b?)(-?\d+)\.wav$', f)
            if m:
                datasets.append(('Legacy', os.path.join(d, f), m.group(1), int(m.group(2)) + 1))

    # Steinway Grand (octave +1)
    d = os.path.join(TEST_DATA_DIR, 'Steinway Grand  (DS)', 'Samples')
    if os.path.exists(d):
        for f in os.listdir(d):
            m = re.search(r'^Steinway_([A-G]#?)(\d)_Dyn2_RR1\.wav$', f)
            if m:
                datasets.append(('Steinway', os.path.join(d, f), m.group(1), int(m.group(2)) + 1))

    # --- Additional DS datasets ---

    # --- Additional DS datasets ---
    # Octave conventions calibrated by testing mid-range notes against detector

    # Boz SL Grand Lite — non-Room samples only (octave: as-is, correct)
    d = os.path.join(TEST_DATA_DIR, 'Boz SL Grand Lite (DS)', 'Samples')
    if os.path.exists(d):
        for f in os.listdir(d):
            if '_Room' in f:
                continue
            m = re.search(r'Piano_([A-G]#?)(\d)(?:-\d+)?\.wav$', f)
            if m:
                datasets.append(('BozSL', os.path.join(d, f), m.group(1), int(m.group(2))))

    # Chapters Piano — octave convention is 2 lower than standard
    d = os.path.join(TEST_DATA_DIR, 'Chapters Piano DS', 'Chapters Piano Samples')
    if os.path.exists(d):
        for f in os.listdir(d):
            m = re.search(r'^([A-G]#?)(-?\d+)_\d+\.wav$', f)
            if m:
                octave = int(m.group(2)) + 2
                datasets.append(('Chapters', os.path.join(d, f), m.group(1), octave))

    # PAMAHA — "Pamaha MAIN H 1 A edited.wav" (octave as-is)
    d = os.path.join(TEST_DATA_DIR, 'PAMAHA', 'SAMPLES 2')
    if os.path.exists(d):
        for f in os.listdir(d):
            m = re.search(r'Pamaha MAIN H (\d) ([A-G](?:b|#)?) edited\.wav$', f)
            if m:
                datasets.append(('PAMAHA', os.path.join(d, f), m.group(2), int(m.group(1))))

    # Mum's Upright — octave +1
    d = os.path.join(TEST_DATA_DIR, "Mum's Upright", 'Samples')
    if os.path.exists(d):
        for f in os.listdir(d):
            m = re.search(r'^([A-G]#?)(\d)_\d+_1\.wav$', f)
            if m:
                datasets.append(("MumsUpright", os.path.join(d, f), m.group(1), int(m.group(2)) + 1))

    # EjIm Piano — EXCLUDED: Inconsistent octave naming convention
    # (A-notes use standard convention, C-notes are off by 1)

    # Playel Felt — octave +1
    d = os.path.join(TEST_DATA_DIR, 'Playel Felt (DS)', 'Samples')
    if os.path.exists(d):
        for f in os.listdir(d):
            m = re.search(r'Pleyel Felt-rr1-f-([a-g]#?)(\d)\.wav$', f)
            if m:
                datasets.append(('Playel', os.path.join(d, f), m.group(1).upper(), int(m.group(2)) + 1))

    # Sol's Piano — octave +1
    d = os.path.join(TEST_DATA_DIR, "Sol's Piano (DS)", 'Samples')
    if os.path.exists(d):
        for f in os.listdir(d):
            m = re.search(r'1910SteinwayBEwks_FF_([A-G](?:b|#)?)(\d)\.wav$', f)
            if m:
                datasets.append(('SolsPiano', os.path.join(d, f), m.group(1), int(m.group(2)) + 1))

    # The King's Upright — octave +1
    d = os.path.join(TEST_DATA_DIR, "The King's Upright (DS)", 'Samples')
    if os.path.exists(d):
        for f in os.listdir(d):
            m = re.search(r'TKI_([A-G]#?)(\d)_Level1_RR1\.wav$', f)
            if m:
                datasets.append(('KingsUpright', os.path.join(d, f), m.group(1), int(m.group(2)) + 1))

    # Midnight Upright V2 — octave +1
    d = os.path.join(TEST_DATA_DIR, '5631_MidnightUprightV2_namiaudio_20220329-115409',
                     'Midnight Upright V2 Decent Sampler', 'Samples')
    if os.path.exists(d):
        for f in os.listdir(d):
            m = re.search(r'Midnight Upright_f_([A-G]#?)(\d)\.wav$', f)
            if m:
                datasets.append(('MidnightUpright', os.path.join(d, f), m.group(1), int(m.group(2)) + 1))

    # Bechstein 1911 Upright — octave +1
    d = os.path.join(TEST_DATA_DIR, '825_v1_Bechstein1911Upright_AndrewWard_DecentSampler',
                     'Bechstein1911 Upright (DS)', 'Samples', 'NR')
    if os.path.exists(d):
        for f in os.listdir(d):
            m = re.search(r'AWBechstein mf ([A-G]#?)(\d)\.wav$', f)
            if m:
                datasets.append(('Bechstein', os.path.join(d, f), m.group(1), int(m.group(2)) + 1))

    # Mickleburgh Piano — EXCLUDED: "Hammer Release" samples are mechanical
    # noise, not pitched piano notes. Not suitable for pitch detection testing.

    return datasets

def run_tests(use_multi_window=False, verbose=False):
    test_cases = discover_datasets()

    if not test_cases:
        print("ERROR: No test cases found. Check TestData directory.")
        return

    # Sort by frequency
    test_cases.sort(key=lambda t: calc_expected_freq(t[2], t[3]))

    detector = KeySpecificDetector()

    success = 0
    total = 0
    failures = []
    per_dataset = {}
    tight_success = 0  # Within ±5 cents (tuner-grade accuracy)

    t0 = time.time()

    for dataset, filepath, note, octave in test_cases:
        expected_freq = calc_expected_freq(note, octave)
        tolerance = get_cents_tolerance(expected_freq)
        note_name = f"{note}{octave}"

        try:
            data, sr = sf.read(filepath, always_2d=True)
        except Exception as e:
            if verbose:
                print(f"  SKIP [{dataset}] {note_name}: {e}")
            continue

        if data.shape[1] > 1:
            data = data.mean(axis=1)
        else:
            data = data[:, 0]

        start_idx = find_onset(data, sr)
        buffer_size = 8192

        if start_idx + buffer_size > len(data):
            start_idx = max(0, len(data) - buffer_size)

        if use_multi_window:
            # Use multiple windows for more robust detection
            available = len(data) - start_idx
            freq = detector.detect_from_long_buffer(
                data[start_idx:], sr, expected_freq,
                buffer_size=buffer_size,
                n_windows=min(4, available // (buffer_size // 2)),
                hop_ratio=0.5
            )
        else:
            buf = data[start_idx:start_idx + buffer_size]
            freq = detector.detect(buf, sr, expected_freq)

        total += 1
        ds_key = dataset
        if ds_key not in per_dataset:
            per_dataset[ds_key] = {'pass': 0, 'fail': 0, 'tight': 0}

        if freq > 0:
            cents_off = 1200 * math.log(freq / expected_freq) / math.log(2)
            if abs(cents_off) < tolerance:
                success += 1
                per_dataset[ds_key]['pass'] += 1
                if abs(cents_off) < 5:
                    tight_success += 1
                    per_dataset[ds_key]['tight'] += 1
                elif verbose:
                    print(f"  WIDE [{dataset}] {note_name}: {cents_off:+.1f}c (exp {expected_freq:.1f}Hz, got {freq:.1f}Hz)")
            else:
                per_dataset[ds_key]['fail'] += 1
                failures.append(f"[{dataset}] {note_name} FAIL: {freq:.1f}Hz (exp {expected_freq:.1f}Hz), {cents_off:+.0f}c (tol ±{tolerance}c)")
        else:
            per_dataset[ds_key]['fail'] += 1
            failures.append(f"[{dataset}] {note_name} FAIL: No detection (exp {expected_freq:.1f}Hz)")

    elapsed = time.time() - t0

    print(f"\n{'='*60}")
    print(f"KeySpecificDetector Test Results")
    print(f"{'='*60}")
    print(f"\nOverall: {success}/{total} passed ({100*success/max(total,1):.1f}%)")
    print(f"Tight (±5c): {tight_success}/{total} ({100*tight_success/max(total,1):.1f}%)")
    print(f"Time: {elapsed:.1f}s ({elapsed/max(total,1)*1000:.0f}ms per note)")

    print(f"\nPer dataset:")
    for ds in sorted(per_dataset.keys()):
        d = per_dataset[ds]
        t = d['pass'] + d['fail']
        print(f"  {ds:15s}: {d['pass']:3d}/{t:3d} pass ({100*d['pass']/max(t,1):.0f}%), "
              f"tight ±5c: {d['tight']:3d}/{t:3d} ({100*d['tight']/max(t,1):.0f}%)")

    if failures:
        print(f"\n--- Failures ({len(failures)}) ---")
        for f in failures:
            print(f"  {f}")

    print(f"\n{'='*60}")
    return success, total, failures

if __name__ == "__main__":
    verbose = '-v' in sys.argv
    multi = '-m' in sys.argv
    run_tests(use_multi_window=multi, verbose=verbose)
