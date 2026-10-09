# Änderungen für Nutzer:innen

Was sich in TILDA sichtbar geändert hat – ohne technische Details. Neueste Einträge stehen oben.

„Neu“ steht für neue Funktionen, „Überarbeitet“ für größere Umbauten, „Feinschliff“ für kleine Anpassungen an Darstellung und Texten, „Behoben“ für Fehlerkorrekturen.

## Zusammenfassung von `030c35e02` bis `f501ae342` (2026-10-06)

- **Straßenfotos – Neu:** In jeder Region gibt es in der Ebenenauswahl die Zeile „Straßenfotos“. Mapillary und Panoramax zeigen ihre Fotos direkt auf der Karte; ein Klick öffnet das Foto in einem Betrachter über der Karte, mit Standort und Blickrichtung. Google Street View, Apple Look Around und infra3D lassen sich für einen angeklickten Ort öffnen. Fotos lassen sich nach Art oder Alter einfärben und über einen Zeitregler filtern; der Zustand steckt im Link. Auch der Inspektor öffnet die Fotos eines Objekts im neuen Betrachter, an der angeklickten Stelle. Die bisherige Kategorie „Mapillary“ entfällt; alte Links schalten stattdessen die Straßenfotos ein.
- **Zeichnen – Überarbeitet:** Flächen im Rechner und Geometrien in Prüflisten lassen sich direkt auf der Karte zeichnen und ändern, ohne zwischen Zeichnen und Bearbeiten zu wechseln. Ecken, Kanten und die ganze Fläche lassen sich jederzeit verschieben; ein Klick auf eine Kante fügt eine Ecke hinzu. In Prüflisten ist erkennbar, welcher Teil eines Eintrags ausgewählt ist.
- **Parken – Überarbeitet:** Zeitangaben in Parkbeschränkungen werden geprüft und häufige Erfassungsfehler automatisch korrigiert (z. B. „Mo-FR“ oder „9:00“); nicht lesbare Angaben erscheinen als „unklare Angabe“ statt als Rohtext. Höchstparkdauern ohne Einheit werden als Stunden oder Minuten erkannt. Sondernutzungen (z. B. Behindertenparkplätze) stehen in der Hauptkategorie vor Verboten, und der Rechner fasst Parkbeschränkungen nach dieser Hauptkategorie zusammen.
- **Hinweise – Neu:** Interne Hinweise lassen sich auch aus unserer eigene Kopie des OSM-Editors iD lesen und schreiben.
- **Feinschliff:** Im Inspektor stehen Bezeichnungen und Werte sauber untereinander; die Links zu den Editoren kiwiD und Rapid entfallen. Im Rechner steht der Zeichenhinweis auf der Karte, die Schaltflächen haben die übliche Größe und Punkte sind leichter zu greifen. Auf radinfra.de zeigt die Ebene „Beleuchtung“ nur noch Radinfrastruktur.
- **Behoben:** Im Rechner schlossen sich Flächen zu früh, das Zeichnen ruckelte, und nach dem Aus- und Einschalten fehlten die Summen. Mit einer gezeichneten Rechner-Fläche ließ sich die Anmeldung nicht starten.

## Zusammenfassung von `2a3236f48` bis `030c35e02` (2026-09-30)

- **Regionen – Neu:** Karte, Hinweise, QA und Prüflisten sind eigene Ansichten einer Region, jede mit eigenem Link, eigener Liste, eigenen Ebenen und eigenem Inspektor. Auf dem Smartphone docken die Listen unten an, damit die Karte nutzbar bleibt. Fährt man in einer Liste über einen Eintrag, wird er auf der Karte hervorgehoben – und umgekehrt; liegt er außerhalb des Ausschnitts, zeigt eine Markierung am Rand die Richtung. Eigene Kommentare in QA und Prüflisten lassen sich nachträglich bearbeiten.
- **Hinweise – Neu:** Interne Hinweise lassen sich in Ordnern organisieren und zwischen Ordnern verschieben; bestehende Hinweise liegen im Ordner „Allgemein“. Liste und Detailansicht wurden dabei überarbeitet.
- **Parken – Neu:** In kleineren Zoomstufen zeigt die Parkraumkarte „Kanten“ mit der Zahl der öffentlichen und privaten Stellplätze je Straßenseite. Die Kanten gibt es auch als Export.
- **QA – Neu:** Zellen, die zuletzt von Personen auf der Vertrauensliste bearbeitet wurden, erhalten den Status „Gut (Vertrauensliste)“.
- **Admin – Überarbeitet:** Der Adminbereich wurde neu gestaltet, mit Seitenleiste, gegliederten Formularen und nach Region gefilterten Listen. Die Änderungshistorie zeigt Namen und erfasst mehr Änderungen.
- **Daten:** Radinfrastruktur liegt wieder auf der Mittellinie der Straße. Gebäudedurchgänge gelten als Tunnel, Arkaden als überdacht. Sehr kurze Stummel und Linien ohne Anschluss ans Netz erscheinen erst beim Hineinzoomen. Fehlerhaft erfasste Parkbedingungen werden als ungültig markiert, statt stillschweigend als Standard zu gelten.
- **Feinschliff:** Hervorhebungen auf der Karte sind beim Überfahren orange und bei Auswahl rot. QA-Flächen bleiben durchsichtig. Beim Ziehen von Seitenleisten erscheint ein kleiner Griff, Pfeile zum Aufklappen drehen sich. Mehr Details zu Parkbeschränkungen sind übersetzt. Dateinamen der Downloads beginnen mit dem Namen der Region. Bei Hinweisen zählt die Zahl der Antworten den ursprünglichen Hinweis nicht mehr mit.
- **Behoben:** Alte Lesezeichen auf Regionen öffnen sich wieder. Die Auswahl der Hintergrundkarten wurde von der Suche verdeckt. Die Karte füllte nicht genau den sichtbaren Bereich.

## Zusammenfassung von `bb5c12841` bis `2a3236f48` (2026-08-31)

- **Regionen – Neu:** Regionen können einen Willkommensbereich mit Titel, Einleitung, Bild und häufigen Fragen zeigen. In öffentlichen Regionen öffnet er sich beim ersten Besuch.
- **Karte – Neu:** Unter „Hintergrundkarten → 3D-Optionen“ lassen sich Höhenrelief und einfache 3D-Gebäude einschalten. Die Karte lässt sich dann drehen und neigen; die Ansicht steckt im Link. Eine ausgewählte Strecke zeigt dabei ihr Höhenprofil; Brücken und Tunnel zählen als Bauwerke, nicht als Gelände.
- **Formulare – Neu:** Hinweise, QA-Kommentare und Willkommenstexte haben einen gemeinsamen Editor mit Formatierung und Vorschau.
- **Kampagnen:** MapRoulette-Aufgaben öffnen sich im OSM-Editor iD statt in Rapid; Rapid bleibt als zweiter Link erhalten.
- **Feinschliff:** Im Inspektor der Parkraumkarte entfällt die Zeile „Zugang“.

## Zusammenfassung von `264881273` bis `bb5c12841` (2026-07-31)

- **Startseite – Überarbeitet:** Die Startseite wurde neu gestaltet, mit Produktübersicht für Radverkehr, Parkraum und Fußverkehr, häufigen Fragen und „Demo anfragen“. Die Links im Fußbereich wurden angepasst.
- **Download und Dokumentation – Neu:** Neben dem Download gibt es einen Dialog „Dokumentation“ mit Links zur Beschreibung aller Datensätze der Region – auch für Personen ohne Download-Rechte. Datensätze lassen sich nur noch mit Rechten in der Region herunterladen; die Dokumentation bleibt öffentlich.
- **Admin – Neu:** Regionen, Logos und Aufträge werden im Adminbereich gepflegt; Änderungen stehen in einer Änderungshistorie.
- **Hintergrundkarten – Neu:** Luftbilder für Berlin 2026, Niedersachsen (ALKIS) und Sachsen 2023–2024.
- **Karte:** Radrouten sind schon in kleineren Zoomstufen sichtbar; Barrieren und Flächennutzungen erscheinen je nach Art und Größe gestaffelt. Wer eine Region ohne Kartenausschnitt öffnet, landet auf dem Startausschnitt der Region statt auf einer Deutschlandkarte.
- **Feinschliff:** Seitenleiste, Legenden, Inspektor, Suche und Dialoge öffnen und schließen sich mit sanften Übergängen (nicht bei reduzierter Bewegung im Betriebssystem). Im Inspektor stimmen Bezeichnungen und Erklärungen mit der Dokumentation überein, Oberflächen sind nach OSM-Wiki und Berliner Planungsbegriffen benannt, lange Werte brechen um, und abgeleitete Einbahnstraßen heißen „abgeleitet“. In der Parkraumkarte entfällt die Zeile „Datenquelle“. Auf dem Smartphone wurden Suche, Dialoge und das Anlegen von Hinweisen nachgebessert.
- **Behoben:** Downloads großer Regionen brachen mit Zeitüberschreitung ab. Das Schloss-Symbol zeigte fälschlich an, dass man sich zum Ansehen der Dokumentation anmelden muss.

## Zusammenfassung von `583f88237` bis `264881273` (2026-06-30)

- **Smartphone – Überarbeitet:** Die Kartenansicht wurde für Smartphones grundlegend umgebaut. Ebenen, Legende, Hintergrundkarten, Suche und Rechner öffnen sich als Leiste von unten; die Karte nutzt den ganzen Bildschirm.
- **Inspektor – Neu:** Der Inspektor lässt sich am Desktop in der Breite ziehen; die Breite bleibt erhalten. Aufgaben („To-dos“) sind übersichtlicher dargestellt und auf die relevanten beschränkt.
- **Dokumentation – Neu:** Alle Datensätze haben eine Dokumentationsseite. Überschriften lassen sich direkt verlinken.
- **Daten:** Seitenwege werden auch entlang von Zufahrtswegen erkannt. Fahrgeschäfte zählen nicht mehr als Barrieren. Exporte liegen einheitlich in EPSG:4326 vor.
- **Feinschliff:** Statusanzeigen und Bezeichnungen der Regionen wurden angepasst. Der Fußbereich hat mehr Links, nach Themen gegliedert, und einen Link „Demo vereinbaren“. Tabellen in der Dokumentation sind besser lesbar. Verkehrszeichen im Inspektor laden schneller; fehlende Übersetzungen für Mapillary wurden ergänzt. Seiten laden durch Komprimierung etwas schneller.
- **Behoben:** Radrouten und Orte von Interesse fehlten in einigen Zoomstufen. Dialoge lagen teils hinter der Kopfzeile.

## Zusammenfassung von `1c1686bf0` bis `583f88237` (2026-05-26)

- **Anmeldung – Behoben:** Die Anmeldung funktioniert wieder, nachdem man die eigene E-Mail-Adresse geändert hat. Bereits vergebene E-Mail-Adressen führen zu einer verständlichen Fehlermeldung. Abgemeldete Personen sahen in privaten Regionen einen falschen Zustand.
- **Export:** Große Downloads laufen zuverlässiger durch. Der Statistik-Export enthält den Regionalschlüssel.
- **E-Mail:** System-E-Mails werden über einen neuen Dienst verschickt.
- **Feinschliff:** Legenden statischer Datensätze sind besser lesbar.
- **Behoben:** Ausgewählte Objekte wurden auf der Karte nicht mehr hervorgehoben.

## Zusammenfassung von `885b4a48d` bis `1c1686bf0` (2026-04-21)

- **Allgemein – Überarbeitet:** TILDA läuft auf einer neuen technischen Grundlage. Lade- und Fehlerseiten, Schaltflächen, Dialoge und Formulare wurden dabei vereinheitlicht; die Karte zeigt beim Laden eine Vorschau.
- **Parken, Rechner – Überarbeitet:** Der Rechner hat ein neues Zeichenwerkzeug und zeigt Teilsummen nach Eigenschaften, etwa nach Betreiber und Art der Beschränkung. Liegt die Fläche außerhalb der Daten, erscheint ein Hinweis.
- **Anmeldung – Überarbeitet:** Nach der Anmeldung über OpenStreetMap fragt ein Dialog nach der E-Mail-Adresse. Fehlerseiten und Fehlermeldungen bei der Anmeldung sind verständlicher.
- **Daten:** Der Export enthält die Angaben zu Seitenwegen und zur Mapillary-Abdeckung. Die Art der Parkbeschränkung berücksichtigt Monatsangaben. In der QA werden Abweichungen nach oben und unten gleich bewertet.
- **Feinschliff:** In der Parkraumkarte entfällt der Hinweis „Beta“; die Art der Parkbeschränkung ist im Inspektor übersetzt und die Legende aktualisiert. Der QA-Status „Fehler im QA-Werkzeug“ ist grünlich statt rot. Die Mapillary-Überlagerung ist standardmäßig ausgeschaltet. Die Dokumentation zum Parken wurde erweitert.
- **Behoben:** Nach dem Abmelden wurden noch Inhalte der vorherigen Sitzung angezeigt. Das eigene Profil ließ sich nicht bearbeiten. Die QA-Kategorie war in öffentlichen Regionen auch ohne Anmeldung sichtbar.

## Zusammenfassung von `78acd7c1a` bis `885b4a48d` (2026-03-23)

- **Parken – Überarbeitet:** Die Zahl der Stellplätze wird genauer auf Abschnitte verteilt. Aussparungen an Kreuzungen, Zufahrten und Bushaltestellen sind genauer; fehlende Bordstein-Abschnitte wurden ergänzt. Zur Betreiberart (öffentlich/privat) sind Quelle und Verlässlichkeit angegeben. Kartenstile und Legenden wurden daran angepasst.
- **QA:** Die Liste folgt dem Filter der Karte und zeigt 30 Einträge. Es gibt mehr Auswahlmöglichkeiten für Prüffälle und eine Liste der eigenen offenen Fälle.
- **Fahrradparken – Neu:** Weitere Eigenschaften mit Übersetzungen; in Überlingen gibt es eine Ebene für Fahrradabstellanlagen.

## Zusammenfassung von `76821690d` bis `78acd7c1a` (2026-02-26)

- **Parken:** Die Stellplatzzahl für Parkplätze abseits der Straße wird nach einer neuen Formel geschätzt; Parkplätze auf Mittelstreifen zählen dazu. Aussparungen bei getrennt erfassten Parkständen und an Autobahnzubringern sowie die Annahmen zur Fahrbahnbreite wurden nachgebessert.
- **Feinschliff:** Der Inspektor kennt weitere Verkehrszeichen für den Radverkehr; die Liste ist sortiert.

## Zusammenfassung von `10a4adb15` bis `76821690d` (2026-01-30)

- **Parken – Überarbeitet:** Parken abseits der Straße wurde grundlegend umgebaut: neue Kategorien, Stile, Übersetzungen und Angaben im Inspektor, einschließlich Zugang und Art der Anlage. Gehwegvorstreckungen und Verkehrsberuhigungen werden als Hindernisse berücksichtigt.
- **Regionen – Neu:** Oberhavel und infraVelo (öffentlich).
- **Radinfrastruktur:** Verkehrsinseln zählen als Querung; teilweise überdachte Wege werden erkannt.
- **Feinschliff:** Unterkategorien können Auswahllisten und Kontrollkästchen mischen und sind durch Abstände gegliedert. Die Schaltfläche für die Legende steht links. Die Summenanzeige der Parkraumkarte steht an neuer Stelle und nennt die Kategorie. Die Ortssuche liefert passendere Treffer. Die Straßendarstellung wurde aktualisiert; Übersetzungen für Querungen wurden ergänzt.
