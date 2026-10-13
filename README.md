# Concepts Media, neue Website

Statische Seite auf Basis des Bootstrap-Templates. Kein Build, kein Server nötig.

## Ansehen

Im Ordner `site/` lokal starten:

```bash
python3 -m http.server 8080
```

Dann im Browser öffnen: http://localhost:8080

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite |
| `standorte.html` | Vermietung für Marken |
| `vermieter.html` | Für Vermieter (neuer Input) |
| `visualisierung.html` | 2D und 3D Planung |
| `ladenbau.html` | Konzept bis Eröffnung |
| `referenzen.html` | Mieter-Wand und Projektfotos |
| `ueber-uns.html` | Zwei Gesellschaften, eine Marke |
| `kontakt.html` | Adresse, Telefon, E-Mail |
| `impressum.html` | Angaben aus der alten Seite |
| `datenschutz.html` | Platzhalter |
| `assets/css/site.css` | Farben, Abstände, Komponenten |
| `assets/css/bootstrap.min.css` | Bootstrap 5 aus dem Template |

## Farben ändern

In `assets/css/site.css` oben stehen alle Farben als Variablen. Der Akzent ist `--cm-accent`.

## Vor dem Live-Gang

Gelbe Hinweisfelder (`todo-note`) zeigen offene Punkte an. Die Liste steht in `../BAUPLAN.md` unter Abschnitt 9.

1. Echte Fotos einsetzen, Liste in `../BILDER_ALTE_SEITE.md`
2. Impressum und Datenschutz rechtlich prüfen lassen
3. Mieter-Namen bestätigen lassen
4. Zahlen bestätigen lassen
5. Kontaktformular einbinden, falls gewünscht (braucht einen Dienst mit Datenschutzvertrag)

## Herkunft

Das Template stammt von WrapPixel (MIT). Die Lizenz und der Hinweis stehen im Template-Ordner `../studiova-agency-business-bootstrap-template-v2/ATTRIBUTION.md`.
