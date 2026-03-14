import { useState } from 'react';
import { Card } from '../components/Card.jsx';
import { Badge } from '../components/Badge.jsx';
import { Button } from '../components/Button.jsx';
import { OrnamentIcon, OrnamentDivider } from '../components/Ornament.jsx';
import { WOERTERBUCH } from '../data/woerterbuch.js';
import styles from './StoryPage.module.css';

// Story Data
const STORY = {
  titel: 'Die Akademie der verlorenen Worte',
  intro: 'In einer Welt, in der Worte Macht besitzen, liegt die legendäre Akademie der Eloquenz verborgen in den Nebeln des Vergessens. Einst war sie der Ort, an dem die größten Redner der Geschichte ihre Kunst perfektionierten. Doch ein dunkler Fluch hat die Worte aus der Akademie gestohlen \u2014 und mit ihnen die Macht der Sprache selbst.',
  kapitel: [
    {
      id: 1,
      titel: 'Kapitel I: Das Tor der Worte',
      szene: 'Ihr steht vor einem gewaltigen Tor aus schwarzem Obsidian. In die Oberfläche sind leere Vertiefungen eingelassen \u2014 dort, wo einst goldene Buchstaben prangten. Eine Stimme flüstert aus dem Stein:',
      dialog: '\u201ENur wer die Sprache ehrt, darf eintreten. Beweise dein Wissen, Wanderer\u2026\u201C',
      challenges: [
        { typ: 'wort_wahl', frage: 'Die Stimme fragt: Welches Wort bedeutet \u201Eredegewandt und sprachlich meisterhaft\u201C?', optionen: ['eloquent', 'turbulent', 'prominent', 'kompetent'], richtig: 0, erklaerung: 'Eloquent \u2014 von lat. \u201Eeloquentia\u201C \u2014 beschreibt die Kunst, sich sprachlich geschickt und überzeugend auszudrücken.', belohnung: 'Das erste goldene Wort erscheint am Tor: E\u00B7L\u00B7O\u00B7Q\u00B7U\u00B7E\u00B7N\u00B7T' },
        { typ: 'luecke', frage: 'Das Tor erzittert und eine Inschrift erscheint: \u201EDie ___ der Sprache liegt nicht im Schreien, sondern im Flüstern.\u201C', optionen: ['Katastrophe', 'Melodie', 'Quintessenz', 'Frequenz'], richtig: 2, erklaerung: 'Quintessenz \u2014 das Wesentlichste, der Kern einer Sache.', belohnung: 'Ein zweites Wort leuchtet auf. Das Tor beginnt sich zu öffnen\u2026' },
        { typ: 'synonym', frage: 'Die letzte Prüfung: Welches Wort ist ein Synonym für \u201Edennoch\u201C oder \u201Etrotz alledem\u201C?', optionen: ['gewissermaßen', 'bedauerlicherweise', 'zwangsläufig', 'nichtsdestotrotz'], richtig: 3, erklaerung: 'Nichtsdestotrotz \u2014 eines der schönsten und längsten deutschen Wörter.', belohnung: 'Das Tor schwingt auf! Dahinter erstreckt sich ein nebelverhangener Innenhof.' },
      ],
      outro: 'Ihr tretet durch das Tor. Der Nebel lichtet sich und enthüllt einen weitläufigen Innenhof mit verfallenen Säulen. An den Wänden hängen verblichene Porträts vergessener Rhetoriker. In der Mitte steht ein Brunnen \u2014 doch statt Wasser fließen leuchtende Buchstaben durch seine Becken. Eine Gestalt in einer dunklen Robe tritt aus dem Schatten\u2026',
    },
    {
      id: 2,
      titel: 'Kapitel II: Der Hüter des Brunnens',
      szene: 'Die Gestalt zieht ihre Kapuze zurück. Ein alter Mann mit silbernem Bart und funkelnden Augen mustert euch. In seiner Hand hält er ein Buch, dessen Seiten leer sind.',
      dialog: '\u201EIch bin Veritas, der letzte Hüter dieser Akademie. Der Fluch hat unsere Worte gestohlen \u2014 aber nicht unser Wissen. Zeig mir, dass du würdig bist, die verlorenen Worte zurückzubringen.\u201C',
      challenges: [
        { typ: 'bedeutung', frage: 'Veritas hebt die Hand und ein Wort erscheint in der Luft: \u201EEPHEMER\u201C. Was bedeutet es?', optionen: ['Gewaltig und mächtig', 'Flüchtig und vergänglich', 'Rätselhaft und mysteriös', 'Fröhlich und heiter'], richtig: 1, erklaerung: 'Ephemer \u2014 wie der Morgentau, der mit den ersten Sonnenstrahlen verschwindet.', belohnung: 'Das Wort sinkt in den Brunnen und das Wasser beginnt heller zu leuchten.' },
        { typ: 'gegenteil', frage: 'Veritas nickt anerkennend: \u201EUnd was ist das Gegenteil von APATHIE?\u201C', optionen: ['Sympathie', 'Nostalgie', 'Euphorie', 'Anarchie'], richtig: 2, erklaerung: 'Euphorie \u2014 ein Zustand überwältigender Begeisterung und Lebensfreude.', belohnung: 'Ein weiteres Wort fließt in den Brunnen. Die Säulen des Innenhofs beginnen zu leuchten.' },
        { typ: 'stilmittel', frage: 'Veritas liest: \u201EDie Freiheit tanzt auf den Trümmern der Tyrannei.\u201C Welches Stilmittel ist das?', optionen: ['Alliteration', 'Hyperbel', 'Ellipse', 'Personifikation'], richtig: 3, erklaerung: 'Personifikation \u2014 der Freiheit wird eine menschliche Handlung (tanzen) zugeschrieben.', belohnung: 'Veritas lächelt. \u201EDu hast Potenzial, Wanderer.\u201C' },
      ],
      outro: 'Der Brunnen pulsiert mit neuem Licht. Die leeren Porträts an den Wänden beginnen, Farbe zu zeigen. Veritas deutet auf eine massive Tür am Ende des Innenhofs, über der ein einziges Wort in Flammen steht: RHETORIKA.',
    },
    {
      id: 3,
      titel: 'Kapitel III: Die Bibliothek der Rhetorika',
      szene: 'Die Tür öffnet sich und ihr betretet eine Bibliothek von unfassbarer Größe. Regale ragen bis in die Unendlichkeit. Doch die meisten Bücher sind leer. In der Mitte schwebt eine leuchtende Gestalt: Rhetorika, die Hüterin der Sprache.',
      dialog: '\u201EEin neuer Aspirant? Wie\u2026 erfrischend. Doch um die Worte zu befreien, musst du die Sprache nicht nur kennen \u2014 du musst sie FÜHLEN.\u201C',
      challenges: [
        { typ: 'satz_bauen', frage: 'Rhetorika stellt die Aufgabe: Welcher Satz enthält eine Antithese?', optionen: ['Der Mond scheint hell über dem dunklen Wald.', 'Gestern war ein wunderschöner Tag gewesen.', 'Viele Menschen gehen gerne im Park spazieren.', 'Nicht die Stärke macht den Helden, sondern die Güte.'], richtig: 3, erklaerung: 'Die Antithese stellt Gegensätze gegenüber: Stärke vs. Güte.', belohnung: 'Ein ganzes Regal füllt sich mit Worten!' },
        { typ: 'klimax', frage: 'Welche Reihenfolge bildet eine Klimax \u2014 eine rhetorische Steigerung?', optionen: ['Er siegte, er sah, er kam.', 'Er sah, er siegte, er kam.', 'Er kam, er sah, er siegte.', 'Er kam, er siegte, er sah.'], richtig: 2, erklaerung: 'Klimax \u2014 die berühmten Worte Cäsars: \u201EVeni, vidi, vici.\u201C', belohnung: 'Bücher fliegen aus den Regalen und öffnen sich!' },
        { typ: 'meister', frage: 'Finale Prüfung: Was beschreibt SUBLIM am besten?', optionen: ['Subtil und kaum wahrnehmbar', 'Erhaben und von höchster Schönheit', 'Schnell und dynamisch', 'Traurig und melancholisch'], richtig: 1, erklaerung: 'Sublim \u2014 ein Wort für Momente, die über das Gewöhnliche hinausgehen.', belohnung: 'Rhetorika lächelt zum ersten Mal. \u201EDu bist würdig.\u201C' },
      ],
      outro: 'Die gesamte Bibliothek erstrahlt in goldenem Licht. Bücher füllen sich, Worte tanzen durch die Luft, und die Akademie der Eloquenz erwacht aus ihrem langen Schlaf. Rhetorika überreicht euch ein leeres Buch mit goldenen Initialen: E.Q. \u201EDieses Buch wird sich füllen, während du lernst. Komm zurück, wenn du bereit bist für das nächste Kapitel\u2026\u201C',
    },
  ],
};

export function StoryPage({ onNavigate }) {
  const [phase, setPhase] = useState('intro');
  const [kapitelIdx, setKapitelIdx] = useState(0);
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [gewaehlt, setGewaehlt] = useState(null);
  const [punkte, setPunkte] = useState(0);
  const [gelernt, setGelernt] = useState([]);
  const [streak, setStreak] = useState(0);

  const kapitel = STORY.kapitel[kapitelIdx];
  const challenge = kapitel?.challenges[challengeIdx];

  const handleAntwort = (idx) => {
    setGewaehlt(idx);
    if (idx === challenge.richtig) {
      setPunkte(p => p + 10 + streak * 2);
      setStreak(s => s + 1);
      setGelernt(prev => [...prev, challenge.erklaerung.split(' \u2014 ')[0]]);
    } else {
      setStreak(0);
    }
  };

  const weiter = () => {
    setGewaehlt(null);
    if (challengeIdx < kapitel.challenges.length - 1) {
      setChallengeIdx(challengeIdx + 1);
      setPhase('challenge');
    } else {
      setPhase('outro');
    }
  };

  const naechstesKapitel = () => {
    if (kapitelIdx < STORY.kapitel.length - 1) {
      setKapitelIdx(kapitelIdx + 1);
      setChallengeIdx(0);
      setPhase('kapitel');
    } else {
      setPhase('ende');
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Score Bar */}
      <div className={styles.scoreBar}>
        <div className={styles.scoreLeft}>
          <span className={styles.points}>{punkte} Punkte</span>
          {streak > 1 && <Badge>{streak}x Streak</Badge>}
        </div>
        <span className={styles.wordsLearned}>{gelernt.length} Wörter gelernt</span>
      </div>

      {/* INTRO */}
      {phase === 'intro' && (
        <div className="animate-in" style={{ textAlign: 'center' }}>
          <OrnamentIcon name="buchOffen" size="xl" style={{ marginBottom: 16 }} />
          <h1 className={styles.introTitle}>{STORY.titel}</h1>
          <Card>
            <p className={`${styles.introText} drop-cap`}>{STORY.intro}</p>
          </Card>
          <div style={{ marginTop: 28 }}>
            <Button variant="gold" onClick={() => setPhase('kapitel')}>Abenteuer beginnen \u2192</Button>
          </div>
        </div>
      )}

      {/* KAPITEL-INTRO */}
      {phase === 'kapitel' && kapitel && (
        <div className="animate-in">
          <Badge>Kapitel {kapitel.id} von {STORY.kapitel.length}</Badge>
          <h2 className={styles.kapitelTitle}>{kapitel.titel}</h2>
          <Card>
            <p className={styles.szene}>{kapitel.szene}</p>
            <div className={styles.dialog}>{kapitel.dialog}</div>
          </Card>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Button variant="gold" onClick={() => setPhase('challenge')}>Prüfung annehmen \u2192</Button>
          </div>
        </div>
      )}

      {/* CHALLENGE */}
      {phase === 'challenge' && challenge && (
        <div className="animate-in">
          <div className={styles.challengeBar}>
            <Badge>Prüfung {challengeIdx + 1}/{kapitel.challenges.length}</Badge>
            <Badge>Kapitel {kapitel.id}</Badge>
          </div>
          <Card>
            <p className={styles.frage}>{challenge.frage}</p>
            <div className={styles.optionen}>
              {challenge.optionen.map((opt, i) => {
                const isGewaehlt = gewaehlt === i;
                const istRichtig = i === challenge.richtig;
                const zeigeErgebnis = gewaehlt !== null;

                let optClass = styles.option;
                if (zeigeErgebnis) {
                  if (istRichtig) optClass = styles.optionRichtig;
                  else if (isGewaehlt && !istRichtig) optClass = styles.optionFalsch;
                  else optClass = `${styles.option} ${styles.optionDisabled}`;
                }

                return (
                  <div
                    key={i}
                    onClick={() => gewaehlt === null && handleAntwort(i)}
                    className={optClass}
                    style={isGewaehlt ? { fontWeight: 600 } : undefined}
                  >
                    <span className={styles.optionLetter}>{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </div>
                );
              })}
            </div>

            {gewaehlt !== null && (
              <div className={`${styles.resultBox} animate-in`}>
                <div className={gewaehlt === challenge.richtig ? styles.resultRichtig : styles.resultFalsch}>
                  <div className={gewaehlt === challenge.richtig ? styles.resultLabelOk : styles.resultLabelFail}>
                    {gewaehlt === challenge.richtig ? '\u2713 Richtig!' : '\u2717 Leider falsch'}
                    {streak > 1 && gewaehlt === challenge.richtig && (
                      <span className={styles.streakBonus}>{streak}x Streak! (+{streak * 2} Bonus)</span>
                    )}
                  </div>
                  <p className={styles.erklaerung}>{challenge.erklaerung}</p>
                  <div className={styles.belohnung}>{challenge.belohnung}</div>
                </div>
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <Button variant="gold" onClick={weiter}>
                    {challengeIdx < kapitel.challenges.length - 1 ? 'Nächste Prüfung \u2192' : 'Weiter in der Geschichte \u2192'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* OUTRO */}
      {phase === 'outro' && kapitel && (
        <div className="animate-in">
          <h2 className={styles.outroTitle}>{kapitel.titel} \u2014 Abschluss</h2>
          <Card>
            <p className={styles.outroText}>{kapitel.outro}</p>
          </Card>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Button variant="gold" onClick={naechstesKapitel}>
              {kapitelIdx < STORY.kapitel.length - 1 ? `Kapitel ${kapitel.id + 1} \u2192` : 'Zum Abschluss \u2192'}
            </Button>
          </div>
        </div>
      )}

      {/* ENDE */}
      {phase === 'ende' && (
        <div className="animate-in" style={{ textAlign: 'center' }}>
          <OrnamentIcon name="lorbeer" size="xl" style={{ marginBottom: 16 }} />
          <h1 className={styles.endeTitle}>Die Akademie erwacht!</h1>
          <p className={styles.endeDesc}>
            Du hast die ersten drei Kapitel gemeistert und die Worte der Akademie befreit.
            Deine Reise hat gerade erst begonnen\u2026
          </p>

          <Card glow ornate style={{ maxWidth: 400, margin: '0 auto 24px' }}>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div className={styles.endScore}>{punkte}</div>
              <div className={styles.endScoreLabel}>Gesamtpunkte</div>
              <div className={styles.statGrid}>
                <div className={styles.statBox}>
                  <div className={styles.statNumGreen}>{gelernt.length}</div>
                  <div className={styles.statLabel}>Wörter gelernt</div>
                </div>
                <div className={styles.statBox}>
                  <div className={styles.statNumGold}>{streak > 0 ? streak : '\u2014'}</div>
                  <div className={styles.statLabel}>Beste Streak</div>
                </div>
              </div>
            </div>
          </Card>

          {gelernt.length > 0 && (
            <Card style={{ maxWidth: 400, margin: '0 auto 24px', textAlign: 'left' }}>
              <div className={styles.gelernteTitle}>
                <OrnamentIcon name="buchOffen" size="sm" style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                Gelernte Wörter
              </div>
              <div className={styles.gelernteWrap}>
                {gelernt.map((w, i) => <Badge key={i}>{w}</Badge>)}
              </div>
            </Card>
          )}

          <div className={styles.hinweisBox}>
            <div className={styles.hinweisText}>
              {'\u201E'}Weitere Kapitel folgen in kommenden Updates.
              Bis dahin: Übe deine Eloquenz im Duell- oder Übungsmodus!{'\u201C'}
            </div>
          </div>

          <div className={styles.finalActions}>
            <Button variant="gold" onClick={() => {
              setPhase('intro'); setKapitelIdx(0); setChallengeIdx(0);
              setPunkte(0); setGelernt([]); setStreak(0);
            }}>Nochmal spielen</Button>
            <Button variant="ghost" onClick={() => onNavigate('home')}>Zum Menü</Button>
          </div>
        </div>
      )}
    </div>
  );
}
