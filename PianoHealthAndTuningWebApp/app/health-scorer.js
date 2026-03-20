// health-scorer.js — Beregner helsescore fra piano-skanneresultater.
// Brukes etter en fullstendig PianoScanner.skannAlle()-kjøring.
//
// Ingen eksterne avhengigheter.

'use strict';

/**
 * HealthScorer
 *
 * Konverterer en array med NoteResultat (fra PianoScanner) til en
 * helhetlig helsescore (0–100) og statusklassifisering.
 *
 * Vekting: Midterste register (rundt A4) vektes mer fordi:
 * 1. Det er registeret pianostemmer jobber mest med
 * 2. De fleste sanger og stykker befinner seg primært her
 * 3. Ørene er mest sensitive for unøyaktighet i 500–2000 Hz-området
 */
class HealthScorer {

    /**
     * Beregner helsescore og klassifisering fra note-resultater.
     *
     * @param {Array} noteResultater - Array[88] med NoteResultat fra PianoScanner
     * @returns {{
     *   score: number|null,
     *   status: 'god'|'trenger_tilsyn'|'kritisk'|'utilstrekkelig_data',
     *   detaljer: object
     * }}
     */
    static score(noteResultater) {
        const bekreftede = noteResultater.filter(r => r?.status === 'bekreftet');

        // Trenger minst 5 bekreftede målinger for meningsfull analyse
        if (bekreftede.length < 5) {
            return {
                score:  null,
                status: 'utilstrekkelig_data',
                detaljer: {
                    bekreftede: bekreftede.length,
                    total:      noteResultater.filter(r => r !== null).length,
                    melding:    'For få toner ble detektert til å beregne en pålitelig score.'
                }
            };
        }

        // Gaussisk vektfunksjon sentrert på A4 (noteIndex 57)
        // Bredde = 3 oktaver (36 halvtoner) som standardavvik
        // → Toner 3 okt unna A4 får ca. 61 % av maks-vekten
        const vekt = (noteIndex) => {
            const A4_INDEX = 57;                // A4 = MIDI 69 = noteIndex 57
            const avstand  = noteIndex - A4_INDEX;
            return Math.exp(-(avstand * avstand) / (2 * 36 * 36));
        };

        let vektetSumAvvik = 0;
        let totalVekt      = 0;
        let maksAvvik      = 0;
        let antallKritiske = 0;  // Toner med > 20 cent absolutt avvik
        let antallAdvarsel = 0;  // Toner med > 10 cent absolutt avvik (men ≤ 20)

        // Per-oktav-statistikk for detaljert rapport
        const perOktav = {};

        for (const r of bekreftede) {
            const absoluttCents = Math.abs(r.cents);

            // Kombinert vekt: posisjonsvekt × klarhet (høyere klarhet → mer pålitelig avlesning)
            const w = vekt(r.noteIndex) * Math.max(0.1, r.klarhet);

            vektetSumAvvik += absoluttCents * w;
            totalVekt      += w;

            if (absoluttCents > maksAvvik)   maksAvvik = absoluttCents;
            if (absoluttCents > 20)          antallKritiske++;
            else if (absoluttCents > 10)     antallAdvarsel++;

            // Samle per-oktav
            const oktavNavn = `Oktav ${r.oktav}`;
            if (!perOktav[oktavNavn]) {
                perOktav[oktavNavn] = { sum: 0, antall: 0, maks: 0 };
            }
            perOktav[oktavNavn].sum    += absoluttCents;
            perOktav[oktavNavn].antall += 1;
            if (absoluttCents > perOktav[oktavNavn].maks) {
                perOktav[oktavNavn].maks = absoluttCents;
            }
        }

        const gjennomsnittAvvik = totalVekt > 0 ? vektetSumAvvik / totalVekt : 0;

        // Helsescore-formel: 100 × exp(−gjennomsnitt / 15)
        //
        // Tolkningstabell:
        //   ~93   → 1 cent gjennomsnitt  (nettopp stemt av profesjonell)
        //   ~85   → 2,5 cent             (profesjonelt stemt, litt tid siden)
        //   ~70   → 5 cent               (akseptabelt, bør stemmes innen et år)
        //   ~50   → 10 cent              (trenger tilsyn snart)
        //   ~30   → 18 cent              (kritisk)
        //   ~10   → 35 cent              (krever løfting / pitch raise)
        const rawScore = 100 * Math.exp(-gjennomsnittAvvik / 15);
        const score    = Math.round(rawScore * 10) / 10;

        // Statusklassifisering
        // Kombinerer score og absolutt antall kritiske toner
        let status;
        if (score >= 70 && antallKritiske === 0) {
            status = 'god';
        } else if (score >= 45 && antallKritiske <= 3) {
            status = 'trenger_tilsyn';
        } else {
            status = 'kritisk';
        }

        // Rund per-oktav-gjennomsnitt
        const perOktavRundet = {};
        for (const [navn, data] of Object.entries(perOktav)) {
            perOktavRundet[navn] = {
                gjennomsnittCents: Math.round((data.sum / data.antall) * 10) / 10,
                maksCents:         Math.round(data.maks * 10) / 10,
                antallToner:       data.antall
            };
        }

        return {
            score,
            status,
            detaljer: {
                gjennomsnittAvvik: Math.round(gjennomsnittAvvik * 10) / 10,
                maksAvvik:         Math.round(maksAvvik * 10) / 10,
                antallKritiske,
                antallAdvarsel,
                bekreftede:        bekreftede.length,
                total:             noteResultater.filter(r => r !== null).length,
                dekning:           Math.round(bekreftede.length / 88 * 100),
                perOktav:          perOktavRundet
            }
        };
    }

    /**
     * Returnerer en norsk tekstbeskrivelse av scoreresultatet.
     * Fem faglig korrekte nivåer basert på diagnose-validering.md.
     *
     * @param {{ score: number, status: string, detaljer: object }} scoreResultat
     * @returns {string}
     */
    static lagBeskrivelse(scoreResultat) {
        const { score, status, detaljer } = scoreResultat;

        if (status === 'utilstrekkelig_data') {
            return 'Ikke nok data til å vurdere pianoets helse. Prøv å skanne flere taster.';
        }

        const avvik = detaljer.gjennomsnittAvvik;
        const s     = score ?? 0;

        if (s >= 85) {
            return 'Pianoet er nylig stemt og i utmerket stand. ' +
                   `Gjennomsnittlig avvik er kun ${avvik} cent. ` +
                   'Neste stemming anbefales om 9–12 måneder.';
        }
        if (s >= 70) {
            return 'Pianoet er i god stand med mindre avvik. ' +
                   `Gjennomsnittlig avvik er ${avvik} cent — stemmebildet er jevnt. ` +
                   'Planlegg stemming innen ett år.';
        }
        if (s >= 50) {
            return `Merkbar forringelse — gjennomsnittlig avvik er ${avvik} cent. ` +
                   (detaljer.antallKritiske > 0
                       ? `${detaljer.antallKritiske} tone${detaljer.antallKritiske === 1 ? '' : 'r'} avviker kritisk. `
                       : '') +
                   'Pianoet bør stemmes innen 3–6 måneder.';
        }
        if (s >= 30) {
            return `Tydelig hørbar skjevhet — gjennomsnittlig avvik er ${avvik} cent. ` +
                   `${detaljer.antallKritiske} toner avviker over 20 cent. ` +
                   'Book stemmer snarest.';
        }
        // Under 30
        return `Kritisk tilstand — gjennomsnittlig avvik er ${avvik} cent og ` +
               `${detaljer.antallKritiske} toner avviker kraftig. ` +
               'Pianoet kan kreve opptrekk (pitch raise) i tillegg til stemming. ' +
               'Book profesjonell stemmer umiddelbart.';
    }

    /**
     * Returnerer kategoriobjekt for en gitt numerisk score.
     * Brukes for farge-koding og tittel i UI.
     *
     * @param {number|null} score - Helsescore 0–100
     * @returns {{ nivaa: number, tittel: string, farge: string }}
     */
    static scoreKategori(score) {
        const s = score ?? 0;
        if (s >= 85) {
            return { nivaa: 1, tittel: 'Utmerket stand',      farge: '#1A7A4A' };
        }
        if (s >= 70) {
            return { nivaa: 2, tittel: 'God stand',           farge: '#2DA870' };
        }
        if (s >= 50) {
            return { nivaa: 3, tittel: 'Trenger stemming',    farge: '#C47B00' };
        }
        if (s >= 30) {
            return { nivaa: 4, tittel: 'Book stemmer snarest', farge: '#E07020' };
        }
        return     { nivaa: 5, tittel: 'Kritisk tilstand',    farge: '#B91C1C' };
    }

    /**
     * Beregner konfidensscore per tone.
     * Kombinerer klarhet, antall avlesninger og avviksstørrelse.
     *
     * @param {object} noteResultat - Et enkelt NoteResultat
     * @param {number} stabilTerskel - STABIL_TERSKEL-verdien fra PianoScanner
     * @returns {number} Konfidensverdi 0–1
     */
    static konfidens(noteResultat, stabilTerskel = 8) {
        if (!noteResultat || noteResultat.status !== 'bekreftet') return 0;

        const baseKonfidensConfidence = noteResultat.klarhet;
        const antallFaktor = Math.min(
            (noteResultat.antallAvlesninger ?? 0) / stabilTerskel, 1.0
        );
        // Store avvik er mer usikre (kan være falske avlesninger)
        const avvikFaktor = Math.abs(noteResultat.cents ?? 0) < 50 ? 1.0 : 0.5;

        return baseKonfidensConfidence * antallFaktor * avvikFaktor;
    }
}
