/* Konzepte: drei Pakete und Baukasten. Auswahl wird per E-Mail angefragt. */
(function () {
  'use strict';
  var GROUPS = [
    { name: 'Marke', items: [
      ['logo', 'Logo und Bildmarke', 'Das Zeichen Ihrer Marke, in allen Formaten.'],
      ['farben', 'Farben und Schrift', 'Eine klare Farbwelt und passende Schriften.'],
      ['brandbook', 'Brandbook', 'Alle Regeln Ihrer Marke an einem Ort.'],
      ['namecheck', 'Namens Recherche', 'Erste Prüfung, ob der Name frei ist.']
    ]},
    { name: 'Produkt', items: [
      ['karte', 'Speisekarte und Rezepturen', 'Angebot, Preisstruktur und Rezeptkarten.'],
      ['fotos', 'Produktfotos', 'Bilder für Karte, Website und Social Media.'],
      ['verpackung', 'Verpackung und Becher', 'Design für Becher, Tüten und Boxen.']
    ]},
    { name: 'Store', items: [
      ['visual', '3D Visualisierung', 'Ihr Laden als 3D Bild, bevor gebaut wird.'],
      ['ladenbau', 'Ladenbau Plan', 'Grundriss und Plan für den Ausbau.'],
      ['werbeanlage', 'Werbeanlage und Schild', 'Fassade und Leuchtschrift als Zeichnung.'],
      ['menuboard', 'Menüboard', 'Gestaltung der Karte über der Theke.']
    ]},
    { name: 'Betrieb', items: [
      ['ablauf', 'Abläufe Küche und Service', 'Wer macht was, Schritt für Schritt.'],
      ['onboarding', 'Onboarding Video', 'Ein Video, das neue Mitarbeiter einarbeitet.'],
      ['businessplan', 'Businessplan', 'Zahlen, Kosten und Planung als Excel.'],
      ['franchise', 'Franchise Handbuch', 'Für Systeme nach einem erfolgreichen Pilotbetrieb.']
    ]},
    { name: 'Auftritt', items: [
      ['website', 'Website', 'Moderne Website, fertig online.'],
      ['social', 'Social Media Start', 'Profile, Vorlagen und die ersten Beiträge.'],
      ['imagefilm', 'Imagefilm', 'Ein kurzer Film über Ihre Marke.'],
      ['erklaer', 'Erklärvideo', 'Ihr Konzept in einer Minute erklärt.'],
      ['launch', 'Eröffnungsplan', 'Was vor und am Eröffnungstag passiert.']
    ]}
  ];
  var PACKS = [
    { id: 'marke', title: 'Marke', sub: 'Für den sichtbaren Start.', items: ['logo', 'farben', 'brandbook', 'website', 'social'] },
    { id: 'laden', title: 'Marke und Store', sub: 'Für die Eröffnung Ihres Ladens.', top: true, plus: 'Alles aus Marke', items: ['karte', 'fotos', 'visual', 'ladenbau', 'werbeanlage', 'imagefilm'] },
    { id: 'komplett', title: 'Komplett', sub: 'Fertig zum Eröffnen und Wachsen.', plus: 'Alles aus Marke und Store', items: ['verpackung', 'menuboard', 'ablauf', 'onboarding', 'businessplan', 'launch'] }
  ];
  var MAIL = 'info@conceptsmedia.de';
  var LABEL = {};
  GROUPS.forEach(function (g) { g.items.forEach(function (it) { LABEL[it[0]] = it[1]; }); });
  function packItems(id) {
    var out = [];
    for (var i = 0; i < PACKS.length; i++) { out = out.concat(PACKS[i].items); if (PACKS[i].id === id) break; }
    return out;
  }

  var sel = new Set(); var packName = '';
  var elPacks = document.getElementById('kzPakete');
  var elBlocks = document.getElementById('kzBausteine');
  if (!elPacks || !elBlocks) return;

  // Pakete
  elPacks.innerHTML = PACKS.map(function (p, i) {
    var lis = (p.plus ? '<li class="kz-plus">' + p.plus + '</li>' : '') + p.items.map(function (k) { return '<li>' + LABEL[k] + '</li>'; }).join('');
    return '<div class="col-lg-4"><div class="kz-pack' + (p.top ? ' is-top' : '') + '">' +
      (p.top ? '<span class="kz-badge">Empfohlen</span>' : '') +
      '<div class="num">0' + (i + 1) + '</div><h3>' + p.title + '</h3><p class="kz-pack-sub">' + p.sub + '</p><ul>' + lis + '</ul>' +
      '<button type="button" class="' + (p.top ? 'btn-cm' : 'btn-cm-outline') + ' w-100" data-pack="' + p.id + '">Paket wählen</button></div></div>';
  }).join('');

  // Baukasten
  elBlocks.innerHTML = GROUPS.map(function (g) {
    return '<div class="kz-group"><h3>' + g.name + '</h3><div class="kz-grid">' + g.items.map(function (it) {
      return '<button type="button" class="kz-block" aria-pressed="false" data-id="' + it[0] + '"><strong>' + it[1] + '</strong><span>' + it[2] + '</span></button>';
    }).join('') + '</div></div>';
  }).join('');

  // Leiste unten fürs Handy
  var bar = document.createElement('div');
  bar.className = 'kz-bar';
  bar.innerHTML = '<span><b id="kzBarCount">0</b> Bausteine</span><a href="#kzSummary">Paket ansehen</a>';
  document.body.appendChild(bar);

  var elList = document.getElementById('kzList'), elCount = document.getElementById('kzCount');
  var elSend = document.getElementById('kzSend'), elSum = document.getElementById('kzSummary');

  function render() {
    elBlocks.querySelectorAll('.kz-block').forEach(function (b) { b.setAttribute('aria-pressed', sel.has(b.dataset.id) ? 'true' : 'false'); });
    var ids = []; GROUPS.forEach(function (g) { g.items.forEach(function (it) { if (sel.has(it[0])) ids.push(it[0]); }); });
    elCount.textContent = ids.length;
    document.getElementById('kzBarCount').textContent = ids.length;
    bar.classList.toggle('is-on', ids.length > 0);
    elList.innerHTML = ids.length ? ids.map(function (k) { return '<li>' + LABEL[k] + '</li>'; }).join('') : '<li class="kz-empty">Noch nichts ausgewählt.</li>';
    var body = 'Hallo Concepts Media,\n\nich interessiere mich für ein Konzept Paket' + (packName ? ' (Start: ' + packName + ')' : '') + '.\n\nMeine Bausteine:\n' +
      ids.map(function (k) { return '- ' + LABEL[k]; }).join('\n') + '\n\nMein Vorhaben:\n\n\nViele Grüße';
    elSend.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Konzept Paket Anfrage') + '&body=' + encodeURIComponent(body);
    elSend.style.pointerEvents = ids.length ? '' : 'none';
    elSend.style.opacity = ids.length ? '' : '.45';
  }
  function flash() { elSum.classList.remove('is-flash'); void elSum.offsetWidth; elSum.classList.add('is-flash'); }

  elBlocks.addEventListener('click', function (e) {
    var b = e.target.closest('.kz-block'); if (!b) return;
    var id = b.dataset.id; sel.has(id) ? sel.delete(id) : sel.add(id); render(); flash();
  });
  elPacks.addEventListener('click', function (e) {
    var b = e.target.closest('[data-pack]'); if (!b) return;
    var p = PACKS.filter(function (x) { return x.id === b.dataset.pack; })[0];
    sel = new Set(packItems(p.id)); packName = p.title; render();
    document.getElementById('baukasten').scrollIntoView({ behavior: 'smooth' });
    setTimeout(flash, 500);
  });
  document.getElementById('kzReset').addEventListener('click', function () { sel.clear(); packName = ''; render(); });
  render();
})();
