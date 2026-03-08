# Nylon Guitar Single Notes — Test Data

Source: [Freesound pack #469](https://freesound.org/people/SpeedY/packs/469/) by **SpeedY**
License: Creative Commons 0 (public domain)

**Location:** `TestData/Nylon-guitar-single-notes/`

## Guitar Context

These are recordings of a **nylon-string (classical) guitar** in standard tuning. Each open string maps to a specific note and octave:

| String | Note | Frequency | In filenames |
|--------|------|-----------|--------------||
| 6th (thickest) | **E2** | 82.41 Hz | `e` |
| 5th | **A2** | 110.00 Hz | `a` |
| 4th | **D3** | 146.83 Hz | `d` |
| 3rd | **G3** | 196.00 Hz | `g` |
| 2nd | **B3** | 246.94 Hz | `b` |
| 1st (thinnest) | **E4** | 329.63 Hz | `e1st` |

## Naming Convention

Files follow the pattern: `{id}__speedy__clean_{string}_{technique}.wav`

- **`str_pick`** — string struck with a pick (brighter attack, more high-frequency content)
- **`str_pluck`** — string plucked with a finger (warmer, rounder tone)
- **`harm`** — natural harmonic (lightly touching the string at a node point, likely the 12th fret)
- **`12th`** / **`5th`** — harmonic played at a specific fret position

---

## File Inventory

### Low E String — E2 (82.41 Hz)

| File | Technique | Expected Pitch |
|------|-----------|----------------|
| [`8396__speedy__clean_e_str_pick.wav`](TestData/Nylon-guitar-single-notes/8396__speedy__clean_e_str_pick.wav) | Picked | **E2** (82.41 Hz) |
| [`8397__speedy__clean_e_str_pluck.wav`](TestData/Nylon-guitar-single-notes/8397__speedy__clean_e_str_pluck.wav) | Plucked | **E2** (82.41 Hz) |
| [`8395__speedy__clean_e_harm.wav`](TestData/Nylon-guitar-single-notes/8395__speedy__clean_e_harm.wav) | Natural harmonic | **E3** (164.81 Hz)¹ |

### A String — A2 (110.00 Hz)

| File | Technique | Expected Pitch |
|------|-----------|----------------|
| [`8382__speedy__clean_a_str_pick.wav`](TestData/Nylon-guitar-single-notes/8382__speedy__clean_a_str_pick.wav) | Picked | **A2** (110.00 Hz) |
| [`8383__speedy__clean_a_str_pluck.wav`](TestData/Nylon-guitar-single-notes/8383__speedy__clean_a_str_pluck.wav) | Plucked | **A2** (110.00 Hz) |
| [`8381__speedy__clean_a_harm.wav`](TestData/Nylon-guitar-single-notes/8381__speedy__clean_a_harm.wav) | Natural harmonic | **A3** (220.00 Hz)¹ |

### D String — D3 (146.83 Hz)

| File | Technique | Expected Pitch |
|------|-----------|----------------|
| [`8388__speedy__clean_d_str_pick.wav`](TestData/Nylon-guitar-single-notes/8388__speedy__clean_d_str_pick.wav) | Picked | **D3** (146.83 Hz) |
| [`8389__speedy__clean_d_str_pluck.wav`](TestData/Nylon-guitar-single-notes/8389__speedy__clean_d_str_pluck.wav) | Plucked | **D3** (146.83 Hz) |
| [`8387__speedy__clean_d_harm.wav`](TestData/Nylon-guitar-single-notes/8387__speedy__clean_d_harm.wav) | Natural harmonic | **D4** (293.66 Hz)¹ |

### G String — G3 (196.00 Hz)

| File | Technique | Expected Pitch |
|------|-----------|----------------|
| [`8402__speedy__clean_g_str_pick.wav`](TestData/Nylon-guitar-single-notes/8402__speedy__clean_g_str_pick.wav) | Picked | **G3** (196.00 Hz) |
| [`8403__speedy__clean_g_str_pluck.wav`](TestData/Nylon-guitar-single-notes/8403__speedy__clean_g_str_pluck.wav) | Plucked | **G3** (196.00 Hz) |
| [`8400__speedy__clean_g_harm.wav`](TestData/Nylon-guitar-single-notes/8400__speedy__clean_g_harm.wav) | Natural harmonic | **G4** (392.00 Hz)¹ |
| [`8401__speedy__clean_g_harm1.wav`](TestData/Nylon-guitar-single-notes/8401__speedy__clean_g_harm1.wav) | Natural harmonic (alt take) | **G4** (392.00 Hz)¹ |

### B String — B3 (246.94 Hz)

| File | Technique | Expected Pitch |
|------|-----------|----------------|
| [`8385__speedy__clean_b_str_pick.wav`](TestData/Nylon-guitar-single-notes/8385__speedy__clean_b_str_pick.wav) | Picked | **B3** (246.94 Hz) |
| [`8386__speedy__clean_b_str_pluck.wav`](TestData/Nylon-guitar-single-notes/8386__speedy__clean_b_str_pluck.wav) | Plucked | **B3** (246.94 Hz) |
| [`8384__speedy__clean_b_harm.wav`](TestData/Nylon-guitar-single-notes/8384__speedy__clean_b_harm.wav) | Natural harmonic | **B4** (493.88 Hz)¹ |

### High E String — E4 (329.63 Hz)

| File | Technique | Expected Pitch |
|------|-----------|----------------|
| [`8393__speedy__clean_e1st_str_pick.wav`](TestData/Nylon-guitar-single-notes/8393__speedy__clean_e1st_str_pick.wav) | Picked | **E4** (329.63 Hz) |
| [`8394__speedy__clean_e1st_str_pluck.wav`](TestData/Nylon-guitar-single-notes/8394__speedy__clean_e1st_str_pluck.wav) | Plucked | **E4** (329.63 Hz) |
| [`8392__speedy__clean_e1st_harm.wav`](TestData/Nylon-guitar-single-notes/8392__speedy__clean_e1st_harm.wav) | Natural harmonic | **E5** (659.26 Hz)¹ |
| [`8391__speedy__clean_e1st_5th.wav`](TestData/Nylon-guitar-single-notes/8391__speedy__clean_e1st_5th.wav) | Harmonic at 5th fret | **E6** (1318.51 Hz)² |
| [`8390__speedy__clean_e1st_12th.wav`](TestData/Nylon-guitar-single-notes/8390__speedy__clean_e1st_12th.wav) | Harmonic at 12th fret | **E5** (659.26 Hz)¹ |

### Non-Note Files

| File | Description | Expected Pitch |
|------|-------------|----------------|
| [`8398__speedy__clean_finger_slide2_delay.wav`](TestData/Nylon-guitar-single-notes/8398__speedy__clean_finger_slide2_delay.wav) | Finger slide on strings (with delay effect) | N/A — no stable pitch |
| [`8399__speedy__clean_finger_slide_delay.wav`](TestData/Nylon-guitar-single-notes/8399__speedy__clean_finger_slide_delay.wav) | Finger slide on strings (with delay effect) | N/A — no stable pitch |

---

## Notes on Harmonics

¹ **12th fret harmonic** — touching the string lightly at the midpoint (12th fret) produces a tone one octave above the open string. The fundamental is suppressed and the 2nd partial sounds clearly. This is the most common natural harmonic and is assumed for all files labeled simply `_harm`.

² **5th fret harmonic** — touching the string at one-quarter of its length (5th fret) produces a tone two octaves above the open string (the 4th partial). This is a higher, more bell-like sound.

## Testing Considerations

- **Picked vs plucked:** Picked notes have a sharper attack with more high-frequency transient energy, which can challenge pitch detectors during the initial ~50 ms. Plucked notes have a smoother onset.
- **Harmonics:** These are particularly challenging for pitch detection because the fundamental frequency of the open string is *absent* — the sounding pitch is an overtone. Detectors must not report the open string frequency.
- **Finger slides:** These have no stable pitch and should cause a pitch detector to return no result (silence/noise gate).
- **Nylon strings:** Compared to steel strings, nylon strings produce fewer high harmonics and a warmer tone, which generally makes pitch detection easier.
