# Mine oppskrifter

En oppskriftsside laget med bare **HTML, CSS og JavaScript**. Ingen backend og ingen byggeverktøy – filene fungerer akkurat som de er, både i Live Server og på GitHub Pages.

## Teste på din egen maskin

Åpne mappen i VS Code og start **Live Server** på `index.html`.

> Siden må åpnes via en server (Live Server eller GitHub Pages). Dobbeltklikker du på `index.html`, kan ikke nettleseren lese oppskriftsfilene, og du får en beskjed om det øverst på siden.

## Legge den ut på GitHub Pages

1. Lag et nytt repo på GitHub, for eksempel `oppskrifter`.
2. Last opp alt innholdet i mappen ("Add file" → "Upload files"). `index.html` skal ligge rett i repoet, ikke inni en ekstra mappe.
3. Gå til **Settings → Pages**, velg **Deploy from a branch**, branch `main` og mappe `/ (root)`, og trykk **Save**.
4. Etter et minutt ligger siden på `https://<brukernavn>.github.io/oppskrifter/`.

## Legge til en oppskrift

**1. Lag fila** i mappen `oppskrifter`, for eksempel `oppskrifter/lasagne.md` (små bokstaver, ingen mellomrom eller æøå i filnavnet):

```markdown
---
title: Lasagne
kategori: Middag
porsjoner: 4
tid: 1 time
notat: Lag dobbel porsjon og frys halvparten!
bilde: bilder/lasagne.png
---

## Ingredienser
- 400 g kjøttdeig
- 1 løk
- Salt og pepper

## Slik gjør du
1. Første steg.
2. Andre steg.

## Tips
Valgfritt – du kan ha så mange ekstra overskrifter du vil.
```

**2. Legg navnet nederst i `oppskrifter/liste.js`** (uten `.md`, og husk komma på linja over):

```js
var OPPSKRIFT_LISTE = [
  "overnattingsgrot",
  "tomatsuppe",
  "pannekaker",
  "lasagne"
];
```

Det er alt. Oppskriften dukker opp på forsiden, under «Alle oppskrifter» og i riktig kategori.

### Feltene øverst

| Felt | Må ha? | Hva det gjør |
|---|---|---|
| `title` | Ja | Navnet på retten |
| `kategori` | Ja | Brukes til kategoriflisene og filteret. Skriver du en ny, dukker den opp av seg selv |
| `porsjoner` | Nei | Gir +/− knapper som regner om mengdene |
| `tid` | Nei | Vises på kortet og oppskriften |
| `notat` | Nei | En liten håndskrevet kommentar under bildet |
| `bilde` | Nei | Sti til et bilde. Uten bilde vises kategori-ikonet i stedet |

Linjer som starter med `#` mellom strekene er kommentarer og blir ignorert.

### Huskeregler

- Overskriften må hete **Ingredienser**, så havner lista i høyre kolonne og porsjonsknappene virker.
- Skriv mengden **først** på hver ingredienslinje (`2 dl melk`, `½ ts salt`, `1,5 dl vann`). Linjer uten tall, som «Salt og pepper», blir stående som de er.
- **Nyeste nederst** i `liste.js`: de tre nederste vises under «Siste oppskrifter».
- Vises ikke oppskriften? Åpne konsollen i nettleseren (F12). Der står det hvis et navn i `liste.js` ikke stemmer med et filnavn.

## Bilder

Legg bildene i mappen `bilder` og skriv `bilde: bilder/navn.png` i oppskriften. Akvarellbilder med lys eller gjennomsiktig bakgrunn (PNG) passer best til designet.

## Kategorier og ikoner

Ikonene ligger i `js/felles.js` under `KATEGORI_IKONER`. Disse har eget ikon: Middag, Frokost, Suppe, Salat, Brød, Kake, Dessert og Pannekaker (pluss flertall som Supper, Kaker og Salater). Andre kategorier får en tallerken med kniv og gaffel.

## Mål og vekt

Ingrediensene i kalkulatoren står øverst i `js/maal-og-vekt.js`. Legg til en ny linje med navnet og hvor mange gram 1 dl veier:

```js
{ navn: "Potetmel", g: 75 },
```

## Filene

| Fil | Hva den gjør |
|---|---|
| `index.html` | Forsiden |
| `oppskrifter.html` | «Alle oppskrifter» med søk og filter |
| `oppskrift.html` | Viser én oppskrift. Hvilken står i adressen: `oppskrift.html?navn=pannekaker` |
| `maal-og-vekt.html` | Kalkulatoren for mål og vekt |
| `style.css` | Hele utseendet. Fargene står øverst og kan byttes der |
| `oppskrifter/liste.js` | Lista over alle oppskriftene |
| `oppskrifter/*.md` | Oppskriftene dine |
| `js/markdown.js` | Leser .md-filene og gjør dem om til HTML |
| `js/felles.js` | Henter oppskriftene, lager kort og ikoner, «Tilfeldig oppskrift» |
| `js/forside.js` | Kategoriflisene og «Siste oppskrifter» på forsiden |
| `js/alle.js` | Søk og filter på «Alle oppskrifter» |
| `js/oppskrift.js` | Oppskriftssiden: ingredienser, avkrysning og porsjoner |
| `js/maal-og-vekt.js` | Utregningene i kalkulatoren |

Menyen øverst står i alle fire HTML-filene. Endrer du den, må du endre i alle.
