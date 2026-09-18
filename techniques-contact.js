fetch('techniques-contact.json')
  .then(function(r) { return r.json(); })
  .then(function(data) {
    var d = data.jujitsuContact;
    var onglets = document.getElementById('dan-onglets');
    var sections = document.getElementById('dan-sections');
    var premier = true;

    d.dans.forEach(function(dan) {
      var btn = document.createElement('button');
      btn.className = 'onglet' + (premier ? ' active' : '');
      btn.textContent = dan.nom + ' — ' + dan.forme;
      btn.onclick = (function(id, b) { return function() { afficherDan(id, b); }; })(dan.id, btn);
      onglets.appendChild(btn);

      var section = document.createElement('div');
      section.id = 'sec-' + dan.id;
      section.className = 'dan-section' + (premier ? ' active' : '');

      var uv1Rows = dan.uv1.lignes.map(function(l) {
        return '<tr><td>' + l[0] + '</td><td><strong>' + l[1] + '</strong></td><td>' + l[2] + '</td><td>' + l[3] + '</td></tr>';
      }).join('');

      var uv1Table = '<table class="seq-table"><thead><tr>' +
        dan.uv1.colonnes.map(function(c) { return '<th>' + c + '</th>'; }).join('') +
        '</tr></thead><tbody>' + uv1Rows + '</tbody></table>';

      function listeHtml(arr) {
        return '<ul>' + arr.map(function(t) { return '<li>' + t + '</li>'; }).join('') + '</ul>';
      }

      var uv2Html = '<div class="nomenclature-grid">' +
        '<div class="nomenclature-col"><h4>👊 Pieds / Poings</h4>' + listeHtml(dan.uv2.piedsPoings) + '</div>' +
        '<div class="nomenclature-col"><h4>🤸 Projections</h4>' + listeHtml(dan.uv2.projections) + '</div>' +
        '<div class="nomenclature-col"><h4>🔒 Ne Waza</h4>' + listeHtml(dan.uv2.neWaza) + '</div>' +
        '</div>';

      section.innerHTML =
        '<div class="dan-header"><h2>' + dan.nom + ' — ' + dan.forme + '</h2><p>' + dan.sousTitre + '</p></div>' +
        '<div class="sous-onglets">' +
          '<button class="sous-onglet active" data-uv="uv1-' + dan.id + '">UV1 — Forme imposée</button>' +
          '<button class="sous-onglet" data-uv="uv2-' + dan.id + '">UV2 — Nomenclature (tirage)</button>' +
        '</div>' +
        '<div class="uv-bloc active" id="uv1-' + dan.id + '">' + uv1Table + '</div>' +
        '<div class="uv-bloc" id="uv2-' + dan.id + '">' + uv2Html + '</div>';

      sections.appendChild(section);
      premier = false;
    });

    // Gestion des sous-onglets UV1/UV2 (délégation d'événements)
    sections.addEventListener('click', function(e) {
      if (e.target.classList.contains('sous-onglet')) {
        var parent = e.target.closest('.dan-section');
        parent.querySelectorAll('.sous-onglet').forEach(function(b) { b.classList.remove('active'); });
        parent.querySelectorAll('.uv-bloc').forEach(function(b) { b.classList.remove('active'); });
        e.target.classList.add('active');
        document.getElementById(e.target.getAttribute('data-uv')).classList.add('active');
      }
    });
  })
  .catch(function(e) { console.error('Erreur chargement techniques-contact.json :', e); });

function afficherDan(id, btn) {
  document.querySelectorAll('.dan-section').forEach(function(s) { s.classList.remove('active'); });
  document.querySelectorAll('#dan-onglets .onglet').forEach(function(o) { o.classList.remove('active'); });
  document.getElementById('sec-' + id).classList.add('active');
  btn.classList.add('active');
}
