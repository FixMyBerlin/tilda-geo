---
title: Parkbeschränkung
---

Unter dem Wert "Parkbeschränkungen" (`condition_category`) wird eine Semikolon getrennte Liste ausgeliefert die verschiedene Parkbeschränkungen beschreibt.

Beispiele:

| Wert                                                      | Übersetzung                                                                       |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `access_restriction (agricultural)`                       | Zugangsbeschränkung (Land-/Forstwirtschaftlicher Verkehr)                         |
| `access_restriction (no, Tu 15:00-18:00)`                 | Zugangsbeschränkung (kein Zugang, Dienstag 15:00-18:00)                           |
| `access_restriction (Mo-Fr 04:30-20:00, PH off)`          | Zugangsbeschränkung (Montag-Freitag 04:30-20:00, Feiertag ausgenommen)            |
| `disabled (except emergency)`                             | Behindertenparkplatz (ausgenommen Einsatz-/Krankenfahrzeuge)                      |
| `paid (stay > 1 hour)`                                    | Nur mit Parkschein (Parkdauer > 1 Stunde)                                         |
| `time_limited (2 days)`                                   | Höchstparkdauer (2 Tage)                                                          |
| `time_limited (4 hours) (08:00-18:00)`                    | Höchstparkdauer (4 Stunden) (08:00-18:00)                                         |
| `vehicle_restriction (only motorcar, motorcycle)`         | Beschränkung auf Fahrzeugklassen (nur Pkw, Motorräder)                            |
| `vehicle_restriction (only delivery) (Mo-Sa 07:00-20:00)` | Beschränkung auf Fahrzeugklassen (nur Lieferverkehr) (Montag-Samstag 07:00-20:00) |

In der TILDA Inspektor-Ansicht werden diese Werte übersetzt dargestellt. In der Attributtabelle sind sie aber nur beispielhaft in ihrer einfachsten Form angegeben. Ebenso kann die Masterportal-Übersetzungs-Tabelle dieser Werte leider nicht übersetzen.
