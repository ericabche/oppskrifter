/* ==========================================================
   markdown.js – gjør om oppskriftsfilene til HTML
   ----------------------------------------------------------
   En .md-fil har to deler:

     ---
     title: Pannekaker        <- "front matter": info om oppskriften
     kategori: Dessert
     ---
     ## Ingredienser          <- selve oppskriften i Markdown
     - 3 dl hvetemel

   lesFrontMatter() deler fila i de to delene.
   markdownTilHtml() gjør Markdown-delen om til HTML.

   Dette er en liten, egen Markdown-leser som forstår det
   oppskrifter trenger: overskrifter (#), punktlister (-),
   nummererte lister (1.), avsnitt, **fet**, *kursiv* og [lenker](adresse).
   ========================================================== */


/* Gjør tekst trygg å sette inn i HTML.
   Uten dette ville f.eks. "<" i en oppskrift ødelagt siden. */
function trygg(tekst) {
  return String(tekst)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


/* ---------- Front matter ----------
   Gir tilbake { data: {title: ..., kategori: ...}, tekst: "resten av fila" } */
function lesFrontMatter(fil) {
  fil = fil.replace(/\r/g, ""); // Windows-linjeskift -> vanlige

  // Finn alt mellom de to "---"-linjene øverst
  var treff = fil.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!treff) return { data: {}, tekst: fil };

  var data = {};
  treff[1].split("\n").forEach(function (linje) {
    linje = linje.trim();
    if (!linje || linje.charAt(0) === "#") return; // tomme linjer og kommentarer hoppes over

    var kolon = linje.indexOf(":");
    if (kolon === -1) return;

    var nokkel = linje.slice(0, kolon).trim();
    var verdi = linje.slice(kolon + 1).trim().replace(/^["']|["']$/g, ""); // fjern evt. anførselstegn
    data[nokkel] = verdi;
  });

  return { data: data, tekst: treff[2] };
}


/* ---------- Tekst inni en linje: fet, kursiv og lenker ---------- */
function inline(tekst) {
  return trygg(tekst)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")   // **fet**
    .replace(/\*(.+?)\*/g, "<em>$1</em>")               // *kursiv*
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (alt, tekst, adresse) {
      // Bare vanlige nettadresser og relative stier, aldri "javascript:"
      if (/^javascript:/i.test(adresse)) return tekst;
      return '<a href="' + adresse + '">' + tekst + "</a>";
    });
}


/* ---------- Selve Markdown-leseren ----------
   Går gjennom fila linje for linje og bygger HTML underveis. */
function markdownTilHtml(md) {
  var html = "";
  var aapenListe = null; // "ul", "ol" eller null hvis vi ikke er i en liste
  var avsnitt = [];      // linjer som hører til samme avsnitt

  // Skriv ut avsnittet vi har samlet opp
  function lukkAvsnitt() {
    if (avsnitt.length) {
      html += "<p>" + inline(avsnitt.join(" ")) + "</p>\n";
      avsnitt = [];
    }
  }
  // Lukk lista vi er i
  function lukkListe() {
    if (aapenListe) {
      html += "</" + aapenListe + ">\n";
      aapenListe = null;
    }
  }
  // Start en liste av riktig type (hvis vi ikke allerede er i en)
  function startListe(type) {
    if (aapenListe !== type) {
      lukkListe();
      html += "<" + type + ">\n";
      aapenListe = type;
    }
  }

  md.replace(/\r/g, "").split("\n").forEach(function (raa) {
    var linje = raa.trim();
    var treff;

    // Tom linje = slutt på avsnitt og lister
    if (!linje) {
      lukkAvsnitt();
      lukkListe();
      return;
    }

    // Overskrift: "## Ingredienser" -> <h2>
    if ((treff = linje.match(/^(#{1,6})\s+(.*)$/))) {
      lukkAvsnitt();
      lukkListe();
      var niva = treff[1].length;
      html += "<h" + niva + ">" + inline(treff[2]) + "</h" + niva + ">\n";
      return;
    }

    // Punktliste: "- 3 dl melk" eller "* 3 dl melk"
    if ((treff = linje.match(/^[-*]\s+(.*)$/))) {
      lukkAvsnitt();
      startListe("ul");
      html += "<li>" + inline(treff[1]) + "</li>\n";
      return;
    }

    // Nummerert liste: "1. Visp mel og melk"
    if ((treff = linje.match(/^\d+[.)]\s+(.*)$/))) {
      lukkAvsnitt();
      startListe("ol");
      html += "<li>" + inline(treff[1]) + "</li>\n";
      return;
    }

    // Alt annet er vanlig tekst
    lukkListe();
    avsnitt.push(linje);
  });

  lukkAvsnitt();
  lukkListe();
  return html;
}
