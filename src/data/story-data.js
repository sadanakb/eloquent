// ============================================================
// ELOQUENT — RPG Story Data
// Die Akademie der Eloquenz (1920er akademische Fantasy)
// ============================================================

export const ARCHETYPES = [
  {
    id: 'dichter',
    name: 'Der Dichter',
    description: 'Meister der kreativen Sprache. Deine Worte malen Bilder und wecken Emotionen.',
    bonus: '+20% Kreativität',
    bonusDetail: 'Kreativität und Wortvielfalt werden höher bewertet',
    color: '#C4956A',
    icon: 'feder',
  },
  {
    id: 'redner',
    name: 'Der Redner',
    description: 'Geborener Rhetoriker. Du überzeugst durch Struktur, Logik und rhetorische Brillanz.',
    bonus: '+15% Rhetorik',
    bonusDetail: 'Rhetorik und Argumentation werden höher bewertet',
    color: '#8B6914',
    icon: 'federn',
  },
  {
    id: 'gelehrter',
    name: 'Der Gelehrte',
    description: 'Wandelndes Lexikon. Dein umfassender Wortschatz beeindruckt selbst die Anspruchsvollsten.',
    bonus: '+20% Wortschatz',
    bonusDetail: 'Wortschatz und Situationsbezug werden höher bewertet',
    color: '#4A6741',
    icon: 'buch',
  },
];

// ============================================================
// STORY CHAPTERS
// ============================================================

export const STORY_CHAPTERS = [
  // --------------------------------------------------------
  // Kapitel 1 — Das Erwachen
  // --------------------------------------------------------
  {
    id: 1,
    titel: 'Das Erwachen',
    szene:
      'Nebel umhüllt die Kopfsteinpflasterstraße, als du vor dem schmiedeeisernen Tor der Akademie der Eloquenz stehst. Ein Schild aus verwittertem Messing verkündet: „Hier beginnt die Reise derer, die das Wort zu führen wagen." Die Laternen flackern im Rhythmus eines unhörbaren Herzschlags.',
    dialog:
      '„Willkommen, junger Adept. Die Akademie hat auf dich gewartet. Doch bevor du eintrittst — beweise, dass du der Sprache würdig bist."',
    challenges: [
      {
        typ: 'multiple_choice',
        frage: 'Welches Wort beschreibt die Fähigkeit, andere durch Sprache zu überzeugen?',
        optionen: ['Eloquenz', 'Resistenz', 'Frequenz', 'Tendenz'],
        richtig: 0,
        erklaerung: '„Eloquenz" stammt vom lateinischen „eloquentia" und bezeichnet die Kunst der Beredsamkeit.',
        punkte: 10,
      },
      {
        typ: 'multiple_choice',
        frage: 'Was bedeutet das Wort „Syntax"?',
        optionen: [
          'Die Lehre von der Wortbedeutung',
          'Der Satzbau und die Satzstruktur',
          'Die Lautlehre einer Sprache',
          'Die Kunst des Schreibens',
        ],
        richtig: 1,
        erklaerung: 'Syntax beschreibt die Regeln, nach denen Wörter zu Sätzen zusammengefügt werden.',
        punkte: 10,
      },
      {
        typ: 'fill_blank',
        satz: 'Die ___ ist das wichtigste Werkzeug eines jeden Redners.',
        optionen: ['Sprache', 'Feder', 'Stille'],
        richtig: 0,
        erklaerung: 'Die Sprache — gesprochen oder geschrieben — ist das Fundament aller Rhetorik.',
        punkte: 10,
      },
    ],
    boss: null,
    decision: null,
    outro:
      'Das schwere Tor schwingt auf. Der Duft von altem Papier und Tinte empfängt dich. Die Akademie der Eloquenz hat einen neuen Adepten aufgenommen.',
  },

  // --------------------------------------------------------
  // Kapitel 2 — Der Bibliothekshüter
  // --------------------------------------------------------
  {
    id: 2,
    titel: 'Der Bibliothekshüter',
    szene:
      'Die Bibliothek der Akademie erstreckt sich über drei Stockwerke. Regale aus dunklem Holz reichen bis zur gewölbten Decke. Zwischen den Buchreihen wandelt eine gebückte Gestalt — der Bibliothekshüter Erasmus, dessen Augen hinter dicken Brillengläsern funkeln.',
    dialog:
      '„Ah, ein neuer Wissbegieriger! Die Bücher hier flüstern Geheimnisse, doch nur wer die richtigen Worte kennt, vermag sie zu hören."',
    challenges: [
      {
        typ: 'fill_blank',
        satz: 'Ein ___ ist ein Wort mit gegensätzlicher Bedeutung zu einem anderen Wort.',
        optionen: ['Synonym', 'Antonym', 'Homonym'],
        richtig: 1,
        erklaerung: 'Ein Antonym ist das Gegenwort — zum Beispiel ist „kalt" das Antonym von „warm".',
        punkte: 10,
      },
      {
        typ: 'fill_blank',
        satz: 'Wörter, die gleich klingen, aber verschiedene Bedeutungen haben, nennt man ___.',
        optionen: ['Antonyme', 'Synonyme', 'Homonyme'],
        richtig: 2,
        erklaerung: 'Homonyme wie „Bank" (Sitzgelegenheit) und „Bank" (Geldinstitut) teilen die Form, nicht die Bedeutung.',
        punkte: 10,
      },
      {
        typ: 'word_order',
        anweisung: 'Bringe die Wörter in die richtige Reihenfolge, um ein bekanntes Sprichwort zu bilden:',
        woerter: ['Reden', 'Schweigen', 'ist', 'Silber', 'ist', 'Gold'],
        richtigeReihenfolge: [0, 2, 3, 1, 4, 5],
        erklaerung: '„Reden ist Silber, Schweigen ist Gold" — ein deutsches Sprichwort über den Wert der Zurückhaltung.',
        punkte: 15,
      },
    ],
    boss: null,
    decision: {
      text: 'Erasmus bittet dich, ein verschollenes Manuskript zu suchen. Doch du hörst auch Gerüchte über verbotene Gänge im Untergeschoss der Bibliothek.',
      choices: [
        {
          label: 'Dem Bibliothekshüter helfen und das Manuskript suchen',
          nextChapterId: 3,
          storyFlag: 'wisdom_path',
        },
        {
          label: 'Die verbotenen Gänge auf eigene Faust erkunden',
          nextChapterId: 3,
          storyFlag: 'courage_path',
        },
      ],
    },
    outro:
      'Die Bibliothek hat dir ihre ersten Geheimnisse offenbart. Doch die wahren Prüfungen stehen noch bevor.',
  },

  // --------------------------------------------------------
  // Kapitel 3 — Die erste Prüfung
  // --------------------------------------------------------
  {
    id: 3,
    titel: 'Die erste Prüfung',
    szene:
      'Der Prüfungssaal liegt im Ostflügel der Akademie. Kerzenleuchter tauchen den Raum in warmes Licht. An den Wänden hängen Porträts berühmter Rhetoriker. Am Ende des Saals wartet eine Gestalt in einer langen, schwarzen Robe — Magister Silentium, der Hüter der Stille.',
    dialog:
      '„Die Sprache ist ein zweischneidiges Schwert. Heute wirst du lernen, es zu führen — oder daran scheitern."',
    challenges: [
      {
        typ: 'multiple_choice',
        frage: 'Was ist eine Metapher?',
        optionen: [
          'Eine Übertreibung zur Verstärkung',
          'Ein sprachliches Bild, das ohne „wie" oder „als" vergleicht',
          'Die Wiederholung eines Wortes am Satzanfang',
          'Eine rhetorische Frage',
        ],
        richtig: 1,
        erklaerung: 'Die Metapher überträgt die Bedeutung eines Wortes auf einen anderen Zusammenhang — z. B. „Das Leben ist eine Reise".',
        punkte: 10,
      },
      {
        typ: 'free_text',
        situation: {
          titel: 'Die Kunst der Metapher',
          kontext:
            'Magister Silentium fordert dich auf, die Bedeutung der Sprache in einem einzigen, bildreichen Satz auszudrücken. Er erwartet eine Metapher.',
          beschreibung:
            'Verfasse einen Satz, der die Kraft der Sprache durch eine ausdrucksstarke Metapher beschreibt. Nutze bildhafte Sprache und vermeide Vergleiche mit „wie" oder „als".',
          schluesselwoerter: ['Metapher', 'Sprache', 'Kraft', 'Bild', 'Macht', 'Feuer', 'Schwert', 'Licht'],
        },
        zeitLimit: 90,
        punkte: 25,
      },
      {
        typ: 'word_order',
        anweisung: 'Ordne die Satzteile zu einem rhetorisch wirkungsvollen Satz:',
        woerter: ['Die Feder', 'mächtiger', 'ist', 'als das Schwert'],
        richtigeReihenfolge: [0, 2, 1, 3],
        erklaerung: '„Die Feder ist mächtiger als das Schwert" — ein Ausdruck der Überlegenheit des geschriebenen Wortes.',
        punkte: 15,
      },
    ],
    boss: {
      name: 'Magister Silentium',
      title: 'Hüter der Stille',
      portrait: 'totenkopf',
      hp: 100,
      threshold: 55,
      weakness: 'Metapher',
      weaknessBonus: 0.3,
      situation: {
        titel: 'Die Stille brechen',
        kontext:
          'Magister Silentium hüllt den Raum in eisige Stille. Nur wer mit kraftvollen Worten die Stille durchbricht, kann ihn besiegen.',
        beschreibung:
          'Schreibe eine leidenschaftliche Rede, die die Stille als Feind der Erkenntnis darstellt. Nutze mindestens eine Metapher, um die Macht des gesprochenen Wortes zu beschwören.',
        schluesselwoerter: ['Stille', 'Sprache', 'Macht', 'Metapher', 'Erkenntnis', 'Wahrheit', 'Stimme', 'Dunkelheit'],
      },
      dialog_intro: '„Stille... ist die wahre Macht. Kannst du sie überwinden?"',
      dialog_win: '„Beeindruckend. Deine Worte haben Gewicht. Geh — die Akademie erwartet Großes von dir."',
      dialog_lose: '„Deine Worte sind hohl. Kehre zurück, wenn du gelernt hast, mit Bedeutung zu sprechen."',
    },
    decision: null,
    outro:
      'Magister Silentium nickt anerkennend. Du hast die erste große Prüfung bestanden. Die Akademie öffnet dir nun tiefere Hallen.',
  },

  // --------------------------------------------------------
  // Kapitel 4 — Verlorene Worte
  // --------------------------------------------------------
  {
    id: 4,
    titel: 'Verlorene Worte',
    szene:
      'Im Archiv der vergessenen Worte liegen Begriffe, die aus dem alltäglichen Sprachgebrauch verschwunden sind. Staub tanzt in den Lichtstrahlen, die durch Buntglasfenster fallen. Hier warten Wörter darauf, wiederentdeckt zu werden.',
    dialog:
      '„Jedes vergessene Wort ist ein verlorener Gedanke. Finde sie, bevor sie für immer verblassen."',
    challenges: [
      {
        typ: 'multiple_choice',
        frage: 'Was bedeutet das veraltete Wort „Mummenschanz"?',
        optionen: ['Ein Kartenspiel', 'Ein Maskenspiel oder Maskerade', 'Eine Handelsware', 'Ein Gerichtsurteil'],
        richtig: 1,
        erklaerung: '„Mummenschanz" bezeichnet ein Maskenspiel oder eine Maskerade — verwandt mit „Mumme" (Maske).',
        punkte: 10,
      },
      {
        typ: 'multiple_choice',
        frage: 'Welches Wort ist ein Synonym für „vortrefflich"?',
        optionen: ['Mediokre', 'Exzellent', 'Rudimentär', 'Peripher'],
        richtig: 1,
        erklaerung: '„Exzellent" und „vortrefflich" drücken beide höchste Qualität aus.',
        punkte: 10,
      },
      {
        typ: 'fill_blank',
        satz: 'Das Gegenteil von „eloquent" ist ___.',
        optionen: ['beredt', 'wortkarg', 'wortgewandt'],
        richtig: 1,
        erklaerung: '„Wortkarg" ist das Antonym zu „eloquent" — jemand, der wenig und ungern spricht.',
        punkte: 10,
      },
      {
        typ: 'word_order',
        anweisung: 'Ordne diese Synonyme vom schwächsten zum stärksten Ausdruck:',
        woerter: ['zufrieden', 'erfreut', 'begeistert', 'ekstatisch'],
        richtigeReihenfolge: [0, 1, 2, 3],
        erklaerung: 'Die Steigerung: zufrieden → erfreut → begeistert → ekstatisch zeigt die Klimax der Gefühlsintensität.',
        punkte: 15,
      },
    ],
    boss: null,
    decision: null,
    outro:
      'Du hast vergessene Worte dem Schweigen entrissen. Sie leuchten nun in deinem Gedächtnis wie wiederentdeckte Edelsteine.',
  },

  // --------------------------------------------------------
  // Kapitel 5 — Der Rhetoriksaal
  // --------------------------------------------------------
  {
    id: 5,
    titel: 'Der Rhetoriksaal',
    szene:
      'Der Rhetoriksaal ist das Herzstück der Akademie — ein amphitheaterförmiger Raum mit Sitzreihen aus poliertem Mahagoni. An der Stirnwand prangt in goldenen Lettern: „Wer das Wort beherrscht, beherrscht die Welt." Hier lernen die Fortgeschrittenen.',
    dialog:
      '„Rhetorik ist keine Dekoration der Sprache — sie ist ihre Architektur. Lerne die Werkzeuge, und du wirst Kathedralen aus Worten errichten."',
    challenges: [
      {
        typ: 'free_text',
        situation: {
          titel: 'Eine überzeugende Rede',
          kontext:
            'Du stehst vor der versammelten Akademie und sollst eine kurze Rede halten, die das Publikum von der Wichtigkeit der Bildung überzeugt.',
          beschreibung:
            'Verfasse eine kurze, überzeugende Rede über den Wert der Bildung. Nutze rhetorische Mittel wie Anapher, Klimax oder rhetorische Fragen, um deine Argumente zu verstärken.',
          schluesselwoerter: ['Bildung', 'Wissen', 'Zukunft', 'Rhetorik', 'Überzeugung', 'Argument', 'Erkenntnis'],
        },
        zeitLimit: 120,
        punkte: 25,
      },
      {
        typ: 'multiple_choice',
        frage: 'Welches rhetorische Mittel liegt vor: „Ich kam, ich sah, ich siegte"?',
        optionen: ['Alliteration', 'Anapher und Klimax', 'Chiasmus', 'Hyperbel'],
        richtig: 1,
        erklaerung: 'Cäsars berühmter Ausspruch nutzt die Anapher (Wiederholung von „ich") und die Klimax (Steigerung der Handlung).',
        punkte: 10,
      },
      {
        typ: 'multiple_choice',
        frage: 'Was ist ein Chiasmus?',
        optionen: [
          'Eine Übertreibung zum Zweck der Betonung',
          'Die Kreuzstellung von Satzgliedern (a-b-b-a)',
          'Die Wiederholung des letzten Wortes am Satzanfang',
          'Ein unvollständiger Satz',
        ],
        richtig: 1,
        erklaerung: 'Der Chiasmus stellt Satzglieder überkreuz — z. B. „Die Kunst ist lang, und kurz ist unser Leben".',
        punkte: 10,
      },
    ],
    boss: null,
    decision: {
      text: 'Der Rhetorikmeister bietet dir zwei Wege an: die Meisterklasse der reinen Beredsamkeit oder den Zugang zu den uralten Schriften der Akademiegründer.',
      choices: [
        {
          label: 'Die Meisterklasse der Beredsamkeit wählen',
          nextChapterId: 6,
          storyFlag: 'eloquence_path',
        },
        {
          label: 'Die uralten Schriften der Gründer studieren',
          nextChapterId: 6,
          storyFlag: 'knowledge_path',
        },
      ],
    },
    outro:
      'Die Grundlagen der Rhetorik sitzen. Du spürst, wie deine Worte an Schärfe und Präzision gewinnen.',
  },

  // --------------------------------------------------------
  // Kapitel 6 — Die Debatte
  // --------------------------------------------------------
  {
    id: 6,
    titel: 'Die Debatte',
    szene:
      'Zwei Rednerpulte stehen einander gegenüber im großen Debattiersaal. Auf der anderen Seite wartet Advocata Dialectica — eine gefürchtete Meisterin der Gegenrede, deren Argumente wie Peitschenhiebe treffen. Das Publikum hält den Atem an.',
    dialog:
      '„Du wagst es, gegen mich anzutreten? Deine Argumente werden wie Herbstlaub im Wind zerfallen."',
    challenges: [
      {
        typ: 'free_text',
        situation: {
          titel: 'Das Eröffnungsplädoyer',
          kontext:
            'Die Debatte beginnt. Das Thema lautet: „Ist die Schönheit der Sprache wichtiger als ihre Klarheit?" Du vertrittst die Position, dass beides vereinbar ist.',
          beschreibung:
            'Verfasse ein Eröffnungsplädoyer, das argumentiert, dass Schönheit und Klarheit der Sprache kein Widerspruch sind. Nutze Beispiele und mindestens eine Antithese.',
          schluesselwoerter: ['Schönheit', 'Klarheit', 'Sprache', 'Antithese', 'Argument', 'Harmonie', 'Ausdruck'],
        },
        zeitLimit: 120,
        punkte: 25,
      },
      {
        typ: 'free_text',
        situation: {
          titel: 'Die Erwiderung',
          kontext:
            'Advocata Dialectica kontert: „Schönheit ist nur Schminke auf dem Gesicht der Wahrheit!" Du musst ihre Argumentation entkräften.',
          beschreibung:
            'Widerlege das Argument, dass sprachliche Schönheit nur oberflächlich sei. Zeige, dass Form und Inhalt einander stärken. Nutze eine Gegenargumentation mit konkreten Beispielen.',
          schluesselwoerter: ['Widerlegung', 'Form', 'Inhalt', 'Wahrheit', 'Beispiel', 'Gegenargument', 'Überzeugung'],
        },
        zeitLimit: 120,
        punkte: 25,
      },
      {
        typ: 'word_order',
        anweisung: 'Ordne die Elemente einer klassischen Argumentation in die richtige Reihenfolge:',
        woerter: ['These', 'Begründung', 'Beispiel', 'Schlussfolgerung'],
        richtigeReihenfolge: [0, 1, 2, 3],
        erklaerung: 'Die klassische Argumentation folgt dem Schema: These → Begründung → Beispiel → Schlussfolgerung.',
        punkte: 15,
      },
    ],
    boss: {
      name: 'Advocata Dialectica',
      title: 'Meisterin der Gegenrede',
      portrait: 'waage',
      hp: 100,
      threshold: 60,
      weakness: 'Antithese',
      weaknessBonus: 0.3,
      situation: {
        titel: 'Das Schlussplädoyer',
        kontext:
          'Die Debatte erreicht ihren Höhepunkt. Advocata Dialectica hat starke Argumente vorgebracht. Nun musst du mit deinem Schlussplädoyer das Publikum endgültig überzeugen.',
        beschreibung:
          'Verfasse ein mitreißendes Schlussplädoyer, das die Einheit von Schönheit und Wahrheit in der Sprache feiert. Nutze Antithesen, um Gegensätze aufzulösen, und schließe mit einem kraftvollen Appell.',
        schluesselwoerter: ['Antithese', 'Wahrheit', 'Schönheit', 'Appell', 'Überzeugung', 'Einheit', 'Sprache', 'Gegensatz'],
      },
      dialog_intro: '„Zeig mir, was deine Worte wert sind. Die Wahrheit fürchtet keine Debatte!"',
      dialog_win: '„Ich... muss gestehen, deine Worte haben mich getroffen. Du hast gewonnen — diesmal."',
      dialog_lose: '„Wie erwartet. Deine Argumente waren so dünn wie Morgennebel. Übe weiter."',
    },
    decision: null,
    outro:
      'Der Debattiersaal hallt noch von deinen Worten wider. Ob Sieg oder Niederlage — du hast gelernt, dass wahre Stärke in der Verbindung von Logik und Leidenschaft liegt.',
  },

  // --------------------------------------------------------
  // Kapitel 7 — Schatten der Akademie
  // --------------------------------------------------------
  {
    id: 7,
    titel: 'Schatten der Akademie',
    szene:
      'In den Kellergängen der Akademie findest du verborgene Räume, deren Existenz in keinem offiziellen Verzeichnis erscheint. Vergilbte Dokumente deuten auf ein Geheimnis hin: Die Akademie wurde einst gegründet, um die Sprache selbst vor dem Vergessen zu schützen.',
    dialog:
      '„Manche Worte wurden absichtlich begraben. Die Frage ist: Von wem — und warum?"',
    challenges: [
      {
        typ: 'fill_blank',
        satz: 'Ein ___ ist ein sprachlicher Ausdruck, der das Gemeinte beschönigend umschreibt.',
        optionen: ['Dysphemismus', 'Euphemismus', 'Archaismus'],
        richtig: 1,
        erklaerung: 'Der Euphemismus beschönigt — z. B. „entschlafen" statt „sterben".',
        punkte: 10,
      },
      {
        typ: 'fill_blank',
        satz: 'Das Wort „Zeitgeist" ist ein Beispiel für ein deutsches ___, das auch im Englischen verwendet wird.',
        optionen: ['Fremdwort', 'Lehnwort', 'Kulturwort'],
        richtig: 2,
        erklaerung: '„Zeitgeist", „Kindergarten" und „Wanderlust" sind deutsche Kulturwörter, die in andere Sprachen übernommen wurden.',
        punkte: 10,
      },
      {
        typ: 'multiple_choice',
        frage: 'Was bedeutet „Palimpsest" in der Sprachwissenschaft?',
        optionen: [
          'Ein mehrfach überschriebenes Manuskript',
          'Eine Sammlung von Redewendungen',
          'Ein veraltetes Wörterbuch',
          'Eine rhetorische Figur',
        ],
        richtig: 0,
        erklaerung: 'Ein Palimpsest ist ein Schriftstück, das abgeschabt und neu beschrieben wurde — Schichten von Text übereinander.',
        punkte: 10,
      },
      {
        typ: 'word_order',
        anweisung: 'Ordne diese Sprachschichten von der ältesten zur jüngsten:',
        woerter: ['Althochdeutsch', 'Mittelhochdeutsch', 'Frühneuhochdeutsch', 'Neuhochdeutsch'],
        richtigeReihenfolge: [0, 1, 2, 3],
        erklaerung: 'Die historischen Sprachstufen des Deutschen: Althochdeutsch (bis 1050) → Mittelhochdeutsch (bis 1350) → Frühneuhochdeutsch (bis 1650) → Neuhochdeutsch (ab 1650).',
        punkte: 15,
      },
    ],
    boss: null,
    decision: null,
    outro:
      'Die Schatten der Akademie haben dir Geheimnisse offenbart, die andere lieber vergessen hätten. Dein Wissen wächst — und mit ihm deine Verantwortung.',
  },

  // --------------------------------------------------------
  // Kapitel 8 — Der Brunnen der Wahrheit
  // --------------------------------------------------------
  {
    id: 8,
    titel: 'Der Brunnen der Wahrheit',
    szene:
      'Im verborgenen Innenhof der Akademie steht ein uralter Brunnen. Sein Wasser schimmert silbern, und es heißt, dass nur die Wahrheit an seiner Oberfläche bestehen kann. Lügen lösen sich darin auf wie Tinte in klarem Wasser.',
    dialog:
      '„Der Brunnen prüft nicht dein Wissen, sondern deine Wahrhaftigkeit. Sprich — und sieh, was bestehen bleibt."',
    challenges: [
      {
        typ: 'free_text',
        situation: {
          titel: 'Die Wahrheit sprechen',
          kontext:
            'Der Brunnen der Wahrheit verlangt von dir eine ehrliche Reflexion. Du sollst in eigenen Worten beschreiben, was Wahrheit in der Sprache bedeutet.',
          beschreibung:
            'Verfasse eine kurze Reflexion darüber, warum Wahrhaftigkeit im Sprechen und Schreiben wichtig ist. Beziehe dich auf die Verantwortung, die mit der Macht der Worte einhergeht.',
          schluesselwoerter: ['Wahrheit', 'Verantwortung', 'Sprache', 'Ehrlichkeit', 'Macht', 'Worte', 'Vertrauen'],
        },
        zeitLimit: 90,
        punkte: 25,
      },
      {
        typ: 'multiple_choice',
        frage: 'Welcher Begriff beschreibt die absichtliche Irreführung durch Sprache?',
        optionen: ['Manipulation', 'Elaboration', 'Artikulation', 'Intonation'],
        richtig: 0,
        erklaerung: 'Sprachliche Manipulation nutzt rhetorische Tricks, um Menschen gezielt in die Irre zu führen — das Gegenteil wahrhaftiger Rhetorik.',
        punkte: 10,
      },
      {
        typ: 'multiple_choice',
        frage: 'Was versteht man unter einem „Strohmann-Argument"?',
        optionen: [
          'Ein besonders starkes Argument',
          'Das Verzerren der gegnerischen Position, um sie leichter zu widerlegen',
          'Ein Argument, das auf persönlicher Erfahrung basiert',
          'Die Wiederholung einer These zur Verstärkung',
        ],
        richtig: 1,
        erklaerung: 'Das Strohmann-Argument ist ein Fehlschluss, bei dem die Position des Gegners verzerrt dargestellt wird, um sie leichter angreifen zu können.',
        punkte: 10,
      },
    ],
    boss: null,
    decision: {
      text: 'Der Brunnen zeigt dir zwei Visionen: In der einen sprichst du die unbequeme Wahrheit vor dem Rat der Akademie. In der anderen nutzt du dein Wissen geschickt, um diplomatisch zu navigieren.',
      choices: [
        {
          label: 'Die ungeschönte Wahrheit vor dem Rat aussprechen',
          nextChapterId: 9,
          storyFlag: 'honor_path',
        },
        {
          label: 'Diplomatisch und strategisch vorgehen',
          nextChapterId: 9,
          storyFlag: 'strategy_path',
        },
      ],
    },
    outro:
      'Das Wasser des Brunnens hat sich beruhigt. Deine Worte haben den Test bestanden. Doch die wahre Prüfung steht noch bevor.',
  },

  // --------------------------------------------------------
  // Kapitel 9 — Die Meisterklasse
  // --------------------------------------------------------
  {
    id: 9,
    titel: 'Die Meisterklasse',
    szene:
      'Der Turm der Meister ragt über alle anderen Gebäude der Akademie hinaus. Hier, in einem kreisrunden Saal mit Fenstern nach allen Himmelsrichtungen, versammeln sich nur die besten Adepten. Die Herausforderungen hier sind die schwersten, die du je erlebt hast.',
    dialog:
      '„Du bist weit gekommen. Doch die Meisterklasse verlangt mehr als Wissen — sie verlangt Meisterschaft. Zeige uns, dass du bereit bist."',
    challenges: [
      {
        typ: 'free_text',
        situation: {
          titel: 'Das Paradoxon der Sprache',
          kontext:
            'Der Großmeister stellt dir eine philosophische Aufgabe: Erkläre, wie Sprache gleichzeitig befreien und gefangen halten kann.',
          beschreibung:
            'Verfasse eine tiefgründige Reflexion über das Paradoxon der Sprache — wie sie uns einerseits die Freiheit des Ausdrucks schenkt und uns andererseits in Denkmuster und Konventionen einschließt. Nutze mindestens ein konkretes Beispiel.',
          schluesselwoerter: ['Paradoxon', 'Freiheit', 'Gefangenschaft', 'Denkmuster', 'Ausdruck', 'Konvention', 'Sprache', 'Grenzen'],
        },
        zeitLimit: 120,
        punkte: 25,
      },
      {
        typ: 'free_text',
        situation: {
          titel: 'Die Laudatio',
          kontext:
            'Du sollst eine Laudatio auf die deutsche Sprache verfassen — eine Lobrede, die ihre Besonderheiten und ihre Schönheit feiert.',
          beschreibung:
            'Schreibe eine kurze, aber wirkungsvolle Laudatio auf die deutsche Sprache. Hebe ihre einzigartigen Eigenschaften hervor: die Fähigkeit zur Wortzusammensetzung, ihren Reichtum an Ausdrücken für Gefühle und Stimmungen, ihre Präzision.',
          schluesselwoerter: ['Laudatio', 'Deutsch', 'Sprache', 'Schönheit', 'Wortbildung', 'Präzision', 'Ausdruck', 'Kultur'],
        },
        zeitLimit: 120,
        punkte: 25,
      },
      {
        typ: 'word_order',
        anweisung: 'Ordne die Elemente einer klassischen Rede (nach Cicero) in die richtige Reihenfolge:',
        woerter: ['Exordium (Einleitung)', 'Narratio (Erzählung)', 'Argumentatio (Beweisführung)', 'Peroratio (Schluss)'],
        richtigeReihenfolge: [0, 1, 2, 3],
        erklaerung: 'Ciceros Redeaufbau: Exordium (Aufmerksamkeit gewinnen) → Narratio (Sachverhalt darstellen) → Argumentatio (Argumente führen) → Peroratio (Appell und Schluss).',
        punkte: 15,
      },
      {
        typ: 'multiple_choice',
        frage: 'Was bezeichnet der Begriff „Sapir-Whorf-Hypothese"?',
        optionen: [
          'Die Theorie, dass alle Sprachen einen gemeinsamen Ursprung haben',
          'Die Idee, dass Sprache das Denken und die Wahrnehmung beeinflusst',
          'Die Regel, dass Grammatik wichtiger ist als Wortschatz',
          'Die Behauptung, dass geschriebene Sprache mächtiger ist als gesprochene',
        ],
        richtig: 1,
        erklaerung: 'Die Sapir-Whorf-Hypothese besagt, dass die Struktur einer Sprache die Art beeinflusst, wie ihre Sprecher die Welt wahrnehmen und denken.',
        punkte: 10,
      },
    ],
    boss: null,
    decision: null,
    outro:
      'Die Meisterklasse hat dich an deine Grenzen gebracht. Doch du hast bewiesen, dass du bereit bist für die letzte Prüfung — das Finale der Akademie der Eloquenz.',
  },

  // --------------------------------------------------------
  // Kapitel 10 — Das Finale
  // --------------------------------------------------------
  {
    id: 10,
    titel: 'Das Finale',
    szene:
      'Die große Halle der Akademie erstrahlt in feierlichem Glanz. Hunderte von Kerzen erleuchten die gewölbte Decke, auf der Szenen großer Reden der Geschichte gemalt sind. Alle Meister, Adepten und Hüter der Akademie haben sich versammelt. Am Ende der Halle thront Rhetorika — die ewige Stimme der Beredsamkeit.',
    dialog:
      '„Adept, du hast den weiten Weg durch die Akademie gemeistert. Nun stehe vor mir und zeige, ob du die Sprache wahrlich beherrschst — oder ob sie dich beherrscht."',
    challenges: [
      {
        typ: 'free_text',
        situation: {
          titel: 'Die Abschlussrede',
          kontext:
            'Vor der versammelten Akademie sollst du deine Abschlussrede halten — eine Rede, die alles vereint, was du gelernt hast.',
          beschreibung:
            'Verfasse eine Abschlussrede vor der Akademie der Eloquenz. Reflektiere über deinen Weg, die Macht der Sprache und was es bedeutet, ein Meister der Worte zu sein. Nutze verschiedene rhetorische Mittel: Metapher, Klimax, Antithese oder Anapher.',
          schluesselwoerter: ['Rede', 'Meisterschaft', 'Sprache', 'Rhetorik', 'Klimax', 'Metapher', 'Reise', 'Erkenntnis', 'Zukunft'],
        },
        zeitLimit: 150,
        punkte: 25,
      },
      {
        typ: 'word_order',
        anweisung: 'Bringe die Stufen der sprachlichen Meisterschaft in die richtige Reihenfolge:',
        woerter: ['Wörter lernen', 'Sätze formen', 'Gedanken ausdrücken', 'Herzen bewegen'],
        richtigeReihenfolge: [0, 1, 2, 3],
        erklaerung: 'Der Weg zur sprachlichen Meisterschaft: Wörter lernen → Sätze formen → Gedanken ausdrücken → Herzen bewegen — eine Klimax der Eloquenz.',
        punkte: 15,
      },
      {
        typ: 'multiple_choice',
        frage: 'Was ist der höchste Zweck der Rhetorik nach Aristoteles?',
        optionen: [
          'Unterhaltung des Publikums',
          'Das Finden der überzeugendsten Mittel in jedem gegebenen Fall',
          'Die Verbreitung von Wahrheit',
          'Die Demonstration sprachlicher Überlegenheit',
        ],
        richtig: 1,
        erklaerung: 'Aristoteles definierte Rhetorik als „die Fähigkeit, bei jedem Gegenstand das möglicherweise Überzeugende zu erkennen".',
        punkte: 10,
      },
    ],
    boss: {
      name: 'Rhetorika',
      title: 'Die ewige Stimme',
      portrait: 'krone',
      hp: 100,
      threshold: 65,
      weakness: 'Klimax',
      weaknessBonus: 0.3,
      situation: {
        titel: 'Die letzte Herausforderung',
        kontext:
          'Rhetorika erhebt sich von ihrem Thron. Ihre Stimme füllt die Halle wie ein Orchester. Sie verlangt von dir den ultimativen Beweis deiner Meisterschaft.',
        beschreibung:
          'Rhetorika will einen Text, der die Essenz der Sprache einfängt. Schreibe einen kraftvollen Abschlusstext, der mit einer Klimax endet — einer Steigerung, die vom Flüstern zum Donnern wächst. Vereinige Metapher, Antithese und Klimax in einem einzigen, unvergesslichen Text.',
        schluesselwoerter: ['Klimax', 'Steigerung', 'Metapher', 'Antithese', 'Meisterschaft', 'Sprache', 'Stimme', 'Donner', 'Ewigkeit'],
      },
      dialog_intro: '„Ich bin die Sprache selbst. Jedes Wort, das je gesprochen wurde, hallt in mir wider. Bist du bereit, gegen das Echo der Ewigkeit anzutreten?"',
      dialog_win: '„In tausend Jahren habe ich wenige Stimmen gehört, die mich berührten. Die deine... wird nicht vergessen werden. Willkommen unter den Meistern."',
      dialog_lose: '„Dein Geist ist willig, doch deine Worte erreichen mich noch nicht. Die Akademie steht dir offen — kehre zurück, wenn du gewachsen bist."',
    },
    decision: null,
    outro:
      'Die Halle erbebt von Applaus. Die Meister der Akademie erheben sich. Ob du Rhetorika besiegt hast oder nicht — dein Weg durch die Akademie der Eloquenz hat dich für immer verändert. Die Worte sind nun dein.',
  },
];

// ============================================================
// STORY ENDINGS
// ============================================================

export const STORY_ENDINGS = [
  {
    id: 'wisdom',
    requiredFlags: ['wisdom_path'],
    titel: 'Der Weise Meister',
    text: 'Du hast den Pfad der Weisheit gewählt und dem Bibliothekshüter geholfen. Das verschollene Manuskript enthüllte dir Geheimnisse, die nur wenige kennen. Als Weiser Meister wirst du die nächste Generation der Akademie unterrichten — denn wahre Eloquenz entspringt der Tiefe des Wissens.',
  },
  {
    id: 'courage',
    requiredFlags: ['courage_path'],
    titel: 'Der Kühne Entdecker',
    text: 'Du hast den Mut aufgebracht, die verbotenen Gänge zu erkunden. Was du dort fandest, veränderte dein Verständnis der Akademie für immer. Als Kühner Entdecker wirst du neue Wege der Sprache beschreiten — denn wahre Eloquenz verlangt den Mut, das Unbekannte zu betreten.',
  },
  {
    id: 'eloquence',
    requiredFlags: ['eloquence_path'],
    titel: 'Die Stimme der Akademie',
    text: 'Du hast dich der reinen Beredsamkeit verschrieben. Deine Reden bewegen Herzen und verändern Gedanken. Als Stimme der Akademie wirst du das Erbe der großen Rhetoriker fortführen — denn wahre Eloquenz ist die Kunst, die Welt mit Worten zu formen.',
  },
  {
    id: 'knowledge',
    requiredFlags: ['knowledge_path'],
    titel: 'Der Hüter des Wissens',
    text: 'Du hast die uralten Schriften studiert und die Geheimnisse der Akademiegründer entschlüsselt. Als Hüter des Wissens bewahrst du das sprachliche Erbe der Menschheit — denn wahre Eloquenz wurzelt in dem Verständnis derer, die vor uns kamen.',
  },
  {
    id: 'honor',
    requiredFlags: ['honor_path'],
    titel: 'Die Stimme der Wahrheit',
    text: 'Du hast stets die Wahrheit gesprochen, auch wenn sie unbequem war. Deine Worte tragen das Gewicht der Aufrichtigkeit. Als Stimme der Wahrheit erinnerst du die Akademie daran, dass Sprache der Wahrheit dienen muss — denn wahre Eloquenz ohne Wahrhaftigkeit ist nur leerer Klang.',
  },
  {
    id: 'strategy',
    requiredFlags: ['strategy_path'],
    titel: 'Der Meisterstratege',
    text: 'Du hast gelernt, deine Worte mit Bedacht zu wählen und diplomatisch zu navigieren. Als Meisterstratege weißt du, dass nicht jede Wahrheit sofort ausgesprochen werden muss — denn wahre Eloquenz liegt auch in der Kunst des richtigen Zeitpunkts.',
  },
  {
    id: 'default',
    requiredFlags: [],
    titel: 'Der Absolvent',
    text: 'Du hast die Akademie der Eloquenz durchschritten und jede Prüfung gemeistert. Dein Weg war einzigartig, geprägt von deinen eigenen Entscheidungen. Als Absolvent trägst du das Wissen und die Kunst der Beredsamkeit hinaus in die Welt — denn wahre Eloquenz ist eine Reise, die niemals endet.',
  },
];
