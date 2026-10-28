/* ==========================================================
   oppskrift.js – viser én oppskrift på oppskrift.html
   ----------------------------------------------------------
   1. Finn hvilken oppskrift som står i adressen (?navn=...)
   2. Hent .md-fila og fyll inn tittel, bilde, notat osv.
   3. Flytt "Ingredienser" over i høyre kolonne
   4. Gjør ingredienslista interaktiv:
      - kryss av ingredienser
      - endre én mengde, så tilpasses alle de andre
      - endre antall porsjoner med + og −
   ========================================================== */

var adresse = new URLSearchParams(window.location.search);
var navn = adresse.get("navn");
var laster = document.getElementById("laster");

if (!navn) {
  laster.textContent = "Ingen oppskrift valgt.";
} else {
  hentOppskrift(navn, 0).then(function (o) {
    if (!o) {
      laster.textContent = "Fant ikke oppskriften «" + navn + "». Sjekk at fila finnes i mappen oppskrifter.";
      return;
    }
    visOppskrift(o);
  });
}


/* ---------- 2. Fyll inn oppskriften ---------- */
function visOppskrift(o) {
  document.title = o.tittel + " – Mine oppskrifter"; // teksten i nettleserfanen
  document.getElementById("tittel").textContent = o.tittel;

  // Merkelapper for kategori og tid
  var merker = '<span class="merke">' + trygg(o.kategori) + "</span>";
  if (o.tid) merker += '<span class="merke">' + trygg(o.tid) + "</span>";
  document.getElementById("merker").innerHTML = merker;

  // Eget bilde, eller kategori-ikonet stort hvis det mangler
  document.getElementById("bilde").innerHTML = o.bilde
    ? '<img src="' + trygg(o.bilde) + '" alt="' + trygg(o.tittel) + '">'
    : kategoriIkon(o.kategori);

  if (o.notat) {
    var notat = document.getElementById("notat");
    notat.textContent = o.notat;
    notat.hidden = false;
  }

  // Selve oppskriften (HTML fra markdown.js)
  var innhold = document.getElementById("innhold");
  innhold.innerHTML = o.html;

  // Vis alt og fjern "Laster oppskrift …"
  laster.remove();
  document.getElementById("oppskrift-topp").hidden = false;
  innhold.hidden = false;

  var ingrediensKolonne = flyttIngredienser(innhold);
  if (ingrediensKolonne) lagIngredienser(ingrediensKolonne, o.porsjoner);
}


/* ---------- 3. Flytt "Ingredienser" opp i høyre kolonne ----------
   Finner overskriften som begynner med "Ingrediens" og flytter den,
   pluss alt etter den, helt til neste overskrift. Gir tilbake lista. */
function flyttIngredienser(innhold) {
  var hoyre = document.getElementById("ingrediens-plass");
  var overskrift = Array.prototype.find.call(innhold.querySelectorAll("h2"), function (h) {
    return h.textContent.trim().toLowerCase().indexOf("ingrediens") === 0;
  });
  if (!overskrift) return null;

  var neste = overskrift.nextElementSibling;
  hoyre.appendChild(overskrift);
  while (neste && neste.tagName !== "H2") {
    var denne = neste;
    neste = neste.nextElementSibling;
    hoyre.appendChild(denne);
  }
  // Ingredienslista kan være delt i flere grupper med ### underoverskrifter
  // (f.eks. "### Bunn" og "### Fyll"), så vi gir tilbake hele kolonnen
  return hoyre.querySelector("ul") ? hoyre : null;
}


/* ---------- Hjelpefunksjoner for tall ---------- */

// Brøktegn vi forstår, og hva de er verdt
var BROK = { "½": 0.5, "⅓": 1 / 3, "⅔": 2 / 3, "¼": 0.25, "¾": 0.75 };

// Et "regulært uttrykk" som finner tallet i starten av en linje.
// Det godtar: 3   1,5   1.5   1/2   ½   1 ½
var TALL_MONSTER = /^(\d+\/\d+|\d+(?:[.,]\d+)?(?:\s*[½⅓⅔¼¾])?|[½⅓⅔¼¾])/;

// Finner "til-tallet" i et intervall, f.eks. "–3" i "2–3 gulrøtter" eller "-100" i "50-100 g"
var TIL_MONSTER = /^\s*[-–]\s*(\d+(?:[.,]\d+)?)/;

// Gjør tekst om til et tall, f.eks. "1 ½" -> 1.5. Ugyldig tekst gir NaN.
function lesTall(tekst) {
  tekst = String(tekst).trim();
  if (!tekst) return NaN;
  if (tekst.indexOf("/") !== -1) {
    var deler = tekst.split("/");
    return Number(deler[0]) / Number(deler[1]);
  }
  var sum = 0;
  Object.keys(BROK).forEach(function (tegn) {
    if (tekst.indexOf(tegn) !== -1) {
      sum += BROK[tegn];
      tekst = tekst.replace(tegn, "");
    }
  });
  if (tekst.trim()) sum += Number(tekst.trim().replace(",", "."));
  return sum;
}

// Gjør et tall om til pen norsk tekst: 1.5 -> "1,5", 2 -> "2"
function skrivTall(tall) {
  var avrundet = tall >= 10 ? Math.round(tall) : Math.round(tall * 10) / 10;
  if (avrundet === 0 && tall > 0) avrundet = Math.round(tall * 100) / 100; // små mengder, f.eks. 0,05
  return String(avrundet).replace(".", ",");
}


/* ---------- 4. Interaktiv ingredienslista ----------
   Alt styres av ett tall: FAKTOR.
   - faktor 1   = oppskriften slik den står
   - faktor 2   = dobbel porsjon
   - faktor 2/3 = to tredjedeler (f.eks. 2 egg i stedet for 3)
   Endrer du en mengde eller antall porsjoner, regner vi ut ny faktor
   og oppdaterer alt annet ut fra den. */
function lagIngredienser(kolonne, originalPorsjoner) {
  var faktor = 1;
  var hoyre = document.getElementById("ingrediens-plass");

  // --- Bygg hver ingredienslinje på nytt ---
  // "3 dl hvetemel" blir: [sirkel] [felt med 3] [" dl hvetemel"]
  // "2–3 gulrøtter" blir: [sirkel] [felt med 2] ["–3"] [" gulrøtter"]
  // "ul li" tar med linjene i ALLE gruppene (Bunn, Fyll osv.)
  var ingredienser = Array.prototype.map.call(kolonne.querySelectorAll("ul li"), function (li) {
    var tekst = li.textContent;
    var treff = tekst.match(TALL_MONSTER);
    var mengde = treff ? lesTall(treff[1]) : null;
    if (mengde === 0) mengde = null;  // "0" kan vi ikke regne fra
    var resten = treff ? tekst.slice(treff[0].length) : tekst;

    // Er det et intervall, f.eks. "2–3"? Da husker vi også det siste tallet.
    var mengdeTil = null;
    var tilTreff = mengde !== null ? resten.match(TIL_MONSTER) : null;
    if (tilTreff) {
      mengdeTil = lesTall(tilTreff[1]);
      resten = resten.slice(tilTreff[0].length);
    }

    li.innerHTML = "";

    // Sirkelen til venstre: en ekte knapp, så den virker med tastatur og skjermleser
    var sjekk = document.createElement("button");
    sjekk.type = "button";
    sjekk.className = "sjekk";
    sjekk.setAttribute("aria-pressed", "false");
    sjekk.setAttribute("aria-label", "Kryss av " + tekst.trim());
    li.appendChild(sjekk);

    // Mengde-feltet (bare hvis linja starter med et tall)
    var felt = null;
    if (mengde !== null) {
      felt = document.createElement("input");
      felt.type = "text";
      felt.inputMode = "decimal";            // tallTastatur på mobil
      felt.className = "mengde";
      felt.setAttribute("aria-label", "Mengde" + resten);
      li.appendChild(felt);
    }

    // "–3" i et intervall: vanlig tekst som regnes om sammen med feltet
    var til = null;
    if (mengdeTil !== null) {
      til = document.createElement("span");
      til.className = "mengde-til";
      li.appendChild(til);
    }

    var rest = document.createElement("span");
    rest.className = "rest";
    rest.textContent = resten;
    li.appendChild(rest);

    // Kryss av: trykk på sirkelen eller på teksten (men ikke i feltet)
    function vend() {
      var ferdig = li.classList.toggle("ferdig");
      sjekk.setAttribute("aria-pressed", String(ferdig));
    }
    sjekk.addEventListener("click", function (e) {
      e.stopPropagation(); // ellers ville klikket også nådd li og krysset av to ganger
      vend();
    });
    li.addEventListener("click", function (e) {
      if (e.target !== felt) vend();
    });

    return { felt: felt, mengde: mengde, til: til, mengdeTil: mengdeTil };
  });

  // --- Porsjonsvelgeren (bare hvis oppskriften har "porsjoner:") ---
  var porsjonBoks = document.getElementById("porsjoner");
  var visning = document.getElementById("antall-porsjoner");
  if (originalPorsjoner > 0) porsjonBoks.hidden = false;

  // --- "Tilbake til original"-knapp, vises bare når noe er endret ---
  var tilbake = document.createElement("button");
  tilbake.type = "button";
  tilbake.className = "tilbakestill";
  tilbake.textContent = "Tilbake til original";
  tilbake.hidden = true;
  hoyre.appendChild(tilbake);

  // --- Hjelpetekst ---
  var hint = document.createElement("p");
  hint.className = "hint";
  hint.textContent = "Trykk på et tall for å endre mengden – resten regnes om. " +
                     "Trykk på sirkelen for å krysse av.";
  hoyre.appendChild(hint);

  // Gjør feltet akkurat bredt nok til teksten i det
  function tilpassBredde(felt) {
    felt.style.width = Math.max(2, felt.value.length + 1) + "ch";
  }

  /* Oppdaterer alle tallene ut fra faktoren.
     unntak = feltet du skriver i akkurat nå, så vi ikke endrer det under fingrene dine */
  function oppdater(unntak) {
    ingredienser.forEach(function (ing) {
      if (!ing.felt) return;                    // linjer uten tall, f.eks. "Salt og pepper"
      if (ing.felt !== unntak) ing.felt.value = skrivTall(ing.mengde * faktor);
      if (ing.til) ing.til.textContent = "–" + skrivTall(ing.mengdeTil * faktor);
      ing.felt.classList.toggle("endret", faktor !== 1);
      tilpassBredde(ing.felt);
    });
    if (originalPorsjoner > 0) visning.textContent = skrivTall(originalPorsjoner * faktor);
    tilbake.hidden = faktor === 1;
  }

  // --- Når du skriver i et mengde-felt ---
  ingredienser.forEach(function (ing) {
    if (!ing.felt) return;

    ing.felt.addEventListener("input", function () {
      tilpassBredde(ing.felt);
      var ny = lesTall(ing.felt.value);
      // Bare regn om hvis det er et gyldig tall over 0
      // (mens du sletter og skriver nytt, er feltet tomt en liten stund)
      if (ny > 0) {
        faktor = ny / ing.mengde;   // f.eks. 2 egg / 3 egg = 0,667
        oppdater(ing.felt);
      }
    });

    // Når du går ut av feltet: rydd opp, f.eks. "2," blir "2", tomt blir forrige verdi
    ing.felt.addEventListener("blur", function () { oppdater(null); });

    // Marker hele tallet når du trykker i feltet, så det er lett å skrive nytt
    ing.felt.addEventListener("focus", function () { ing.felt.select(); });

    // Enter = ferdig med feltet
    ing.felt.addEventListener("keydown", function (e) {
      if (e.key === "Enter") ing.felt.blur();
    });
  });

  // --- + og − for porsjoner ---
  porsjonBoks.querySelectorAll("[data-endre]").forEach(function (knapp) {
    knapp.addEventListener("click", function () {
      // Gå til neste hele porsjon: fra 2,7 gir + 3 og − 2. Fra 3 gir + 4 og − 2.
      // (avrundingen til 3 desimaler fjerner små regnefeil, f.eks. 2,9999999)
      var naa = Math.round(originalPorsjoner * faktor * 1000) / 1000;
      var antall = knapp.dataset.endre === "1" ? Math.floor(naa) + 1 : Math.ceil(naa) - 1;
      antall = Math.max(1, antall);            // aldri under 1 porsjon
      faktor = antall / originalPorsjoner;
      oppdater(null);
    });
  });

  // --- Tilbake til original ---
  tilbake.addEventListener("click", function () {
    faktor = 1;
    oppdater(null);
  });

  oppdater(null); // fyll inn tallene første gang
}
