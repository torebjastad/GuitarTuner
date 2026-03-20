# PianoHelse — Executive Summary
**Seed Round 2026 · Confidential**

---

## The Company

**PianoHelse** ("Piano Health") is Norway's first integrated platform for piano health diagnostics and tuner booking. We enable piano owners to assess their instrument's tuning condition in minutes using their smartphone's microphone — and book a certified piano tuner with a single click.

Website: pianohelse.no | Language: Norwegian (Nordic expansion from Year 3)

---

## The Problem

**Piano owners don't know their piano's health. Finding a tuner is hard.**

Norway has an estimated 75,000–120,000 pianos in homes, music schools, churches, and cultural venues. According to European industry data and interviews with active Norwegian piano tuners, approximately **60% of home pianos are not tuned regularly** — not because owners don't care, but because the process is opaque and difficult.

There is no objective way to know whether a piano needs tuning without paying for a professional visit (avg. NOK 2,853 / ~EUR 245). There is no dedicated marketplace. There is no standardised pricing. And the supply side is shrinking: the number of certified piano tuners in Europe **fell 15% between 2021 and 2024**. Norway has only **66 authorised members** of NPTF (Norges Pianostemmer og Teknikerforening — the national piano tuner association).

The result: a market where both sides lose. Piano owners delay servicing. Tuners operate below capacity. Pianos deteriorate silently.

---

## The Solution

**A two-sided platform: AI audio diagnostics + a curated tuner marketplace.**

**Step 1 — Diagnose (5 minutes, free):**
The piano owner visits pianohelse.no on any smartphone. No app download, no account required. They grant microphone access and play each white key. PianoHelse's proprietary pitch detection engine, **UltimateDetector**, analyses each note in real time, measures the deviation in cents from equal temperament, and generates an instant health report.

**The health report includes:**
- A full **tuning curve** showing cent deviation per note across the keyboard
- A plain-language **health grade**: Good / Needs Service / Critical
- A Norwegian-language explanation — no jargon, no guesswork
- An indication of whether a full pitch raise is required (severe detuning)

**Step 2 — Book (one click):**
The owner clicks "Book a Tuner", enters their postcode and email. The diagnostic report is automatically attached to the booking request. Nearby tuners see the piano's condition before they arrive. The owner receives offers within 24 hours. PianoHelse charges 18% commission on each completed job.

**Key technical advantage:** All audio analysis runs client-side in the browser. No audio data is ever transmitted to a server. This is a core privacy feature, GDPR-compliant by design, and production-ready today.

---

## Market Opportunity

**Norway first. Europe next.**

| Market | Estimate | Basis |
|---|---|---|
| **TAM** — Norway piano tuning market | NOK 180–300M/year | 75,000–120,000 pianos × 1–2 tunings/year × NOK 2,853 avg. price |
| **SAM** — Digitally reachable piano owners | NOK 60–100M/year | Actively used pianos in major urban areas |
| **SOM** — Realistic 3-year target (5% share) | NOK 5.13M/year (platform revenue) | 10,000 jobs × NOK 513 commission |

The global piano tuning services market is valued at USD 1.8 billion (2024), growing at 4.2% CAGR toward USD 2.7 billion by 2033.

**There are 35 million pianos in Europe.** The same market failure — opaque health, fractured supply, no digital infrastructure — exists across Scandinavia, Germany, France, and the UK. Norway is the beachhead: manageable geography, high digital adoption, strong musical culture (Grieg, Hellstrøm), and a concentrated tuner network we can onboard efficiently.

---

## Business Model

**Simple, transparent, aligned.**

- **Primary revenue:** 18% commission on each completed booking
- **Average job value:** NOK 2,853 (source: Pianostemmeren AS, 2026 pricing)
- **PianoHelse revenue per job:** ~NOK 513
- **Piano owners pay nothing extra** — normal market rate, settled directly
- **Tuners pay nothing to list** — commission is deducted only on successful jobs

Secondary revenue streams (Phase 2–3): tuner subscription plans (NOK 299–599/month for profile boosting), premium diagnostic reports with history (NOK 149/year), institutional service agreements for music schools and hotels, and B2B API integration with piano manufacturers (Steinway, Yamaha, Kawai).

**Unit economics at scale:**
- 5 cities × 200 jobs/month = 1,000 jobs/month
- Monthly platform revenue: NOK 513,000
- Annual run rate: ~NOK 6.2M — before secondary revenue streams

---

## Financial Projections

| Year | Total Jobs | Gross Job Value | Platform Revenue (18%) | Notes |
|---|---|---|---|---|
| Year 1 | 500 | NOK 1.43M | **NOK 257K** | Oslo only; commission active from month 12 |
| Year 2 | 3,000 | NOK 8.56M | **NOK 1.54M** | Oslo + Bergen + Trondheim |
| Year 3 | 10,000 | NOK 28.5M | **NOK 5.13M** | 5+ cities nationally |

Break-even estimated at approximately 2,350 cumulative jobs — achievable within Year 2.

*These projections are estimates based on stated assumptions. They do not constitute a guarantee of future revenue.*

---

## Traction

**We have already built what is hardest to build.**

- **UltimateDetector** — the proprietary pitch detection algorithm covering the full piano range (A0–C8, 27.5 Hz to 4,186 Hz) — is complete, validated, and production-ready.
- Full product requirements specification (MVP and Phase 2) is documented and signed off.
- Go-to-market strategy is complete: Oslo-first, supply-first, with specific named tuner contacts and NPTF outreach plan.
- Brand identity, tone-of-voice, and visual direction are defined.
- NPTF contact network identified — first 15–20 Oslo-region tuners mapped for pre-launch recruitment.
- GDPR-compliant architecture designed and documented (all audio processing client-side).

What remains is engineering (backend, UI, booking flow), design execution, and tuner onboarding — all conventional execution risk, not technology risk.

---

## Team

PianoHelse requires — and is building — a founding team with four essential competencies:

**CEO / Product Lead:** Norwegian B2C market experience; two-sided marketplace expertise; investor relationships (Investinor, Norse VC, Katapult).

**CTO / Lead Developer:** Web Audio API, JavaScript (client-side audio), PWA architecture; GDPR-compliant backend; payment integrations (Vipps + Stripe).

**UX Designer:** Mobile-first, data visualisation (the tuning curve is the core product moment), Norwegian consumer product sensibility.

**Piano Expert Advisor:** Authorised NPTF tuner — validates diagnostic thresholds, provides credibility with the tuner community, opens NPTF channel.

---

## The Ask

**Seed round: NOK 3,500,000 (~EUR 300,000)**

| Use of Funds | % | Amount |
|---|---|---|
| Technology & Product | 60% | NOK 2.1M |
| Marketing & Growth | 25% | NOK 875K |
| Operations & Legal | 15% | NOK 525K |

**Runway:** 18 months

**18-month milestones this funding unlocks:**
- 100 active, verified tuners on the platform
- 2,000 completed bookings
- Commission model live and proven
- National coverage across 5 Norwegian cities
- Ready for Series A or further growth financing

We are open to convertible notes (20% discount at next round) or direct equity. We are looking for investors who bring Norwegian market access, B2C/marketplace experience, and a long-term perspective.

---

## Why Now

The piano tuning market has been analogue for 150 years. Two things have changed:

1. **Smartphones have microphones good enough** for pitch detection. The Web Audio API makes client-side audio analysis practical and privacy-safe.
2. **The supply side is shrinking.** As fewer young people enter the tuner profession, the existing tuners need better tools to manage demand — and PianoHelse gives them exactly that.

The window to build a defensible, vertically specialised marketplace in this category is open. A generalist platform (Mittanbud, Thumbtack) could enter, but would lack diagnostic capability, category credibility, and the tuner relationships we are building now.

---

> *"There are 35 million pianos in Europe. We're starting with Norway."*

**PianoHelse — Seed Round 2026**
*All figures in NOK unless otherwise stated. Confidential — not for redistribution.*
