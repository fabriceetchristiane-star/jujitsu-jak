// Affichage des techniques d'une ceinture + recherche tolérante aux fautes.
// La page définit GRADE ('jaune', 'orange', ...) avant de charger ce script.
(function () {
  const NOMS = { jaune: 'Jaune', orange: 'Orange', verte: 'Verte', bleue: 'Bleue', marron: 'Marron' };
  const container = document.getElementById('contenu-techniques');

  const style = document.createElement('style');
  style.textContent = `
    .recherche-tech { width:100%; box-sizing:border-box; padding:12px 14px; font-size:1em; border:2px solid #1a3a5c; border-radius:10px; margin:6px 0 4px; }
    .recherche-info { color:#666; font-size:0.85em; margin:0 0 10px; min-height:1.2em; }
    .tech-ligne { background:white; padding:10px 14px; margin:6px 0; border-radius:8px; box-shadow:0 1px 4px rgba(0,0,0,0.08); border-left:4px solid #1a3a5c; }
    .tech-ligne a { color:#1a3a5c; font-weight:bold; text-decoration:none; }
    .tech-ligne a:hover { text-decoration:underline; }
    .tech-ligne .tech-desc { color:#666; font-size:0.88em; margin-top:2px; }
    .tech-ligne .tech-manque { color:#b71c1c; font-size:0.85em; margin-left:6px; }
    .tech-grade { display:inline-block; font-size:0.75em; background:#eef2f6; color:#1a3a5c; border-radius:10px; padding:1px 8px; margin-left:6px; }
    .autres-titre { margin-top:28px; font-weight:bold; color:#555; }
  `;
  document.head.appendChild(style);

  // Normalisation : minuscules, sans accents, sans tirets/espaces/apostrophes
  function norm(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  // Distance d'édition minimale entre q et n'importe quel morceau de t
  function distanceDansTexte(q, t) {
    if (!q) return 0;
    if (t.includes(q)) return 0;
    let prev = new Array(q.length + 1);
    for (let i = 0; i <= q.length; i++) prev[i] = i;
    let best = prev[q.length];
    for (let j = 1; j <= t.length; j++) {
      const cur = [0];
      for (let i = 1; i <= q.length; i++) {
        const cout = q[i - 1] === t[j - 1] ? 0 : 1;
        cur[i] = Math.min(prev[i] + 1, cur[i - 1] + 1, prev[i - 1] + cout);
      }
      if (cur[q.length] < best) best = cur[q.length];
      prev = cur;
    }
    return best;
  }

  function tolerance(len) { return len <= 3 ? 0 : len <= 6 ? 1 : len <= 10 ? 2 : 3; }

  // Chaque mot tapé doit se retrouver (à quelques fautes près) dans la technique.
  // On essaie aussi la requête entière collée ("oie tsuki" -> "oietsuki").
  function correspond(tech, requete) {
    const nom = norm(tech.nom + ' ' + (tech.categorie || ''));
    const texte = norm(tech.nom + ' ' + (tech.description || '') + ' ' + (tech.categorie || ''));
    const mots = requete.split(/\s+/).map(norm).filter(Boolean);
    if (!mots.length) return { ok: true, score: 0 };
    let score = 0, ok = true;
    for (const m of mots) {
      const d = Math.min(distanceDansTexte(m, nom), distanceDansTexte(m, texte));
      if (d > tolerance(m.length)) { ok = false; break; }
      score += d;
    }
    const colle = mots.join('');
    const dc = distanceDansTexte(colle, nom);
    if (dc <= tolerance(colle.length) && (!ok || dc < score)) { ok = true; score = dc; }
    return ok ? { ok: true, score } : { ok: false };
  }

  function ligne(t, gradeAutre) {
    const nom = t.video
      ? `<a href="${t.video}" target="_blank" rel="noopener">▶ ${t.nom}</a>`
      : `<strong>${t.nom}</strong><span class="tech-manque">❌ Vidéo à trouver</span>`;
    const badge = gradeAutre ? `<span class="tech-grade">${NOMS[gradeAutre] || gradeAutre}</span>` : '';
    return `<div class="tech-ligne">${nom}${badge}${t.description ? `<div class="tech-desc">${t.description}</div>` : ''}</div>`;
  }

  fetch('techniques-jujitsu.json')
    .then(r => r.json())
    .then(data => {
      const techniques = data[GRADE] || [];
      if (!techniques.length) { container.innerHTML = '<p style="color:#888;">Techniques à venir.</p>'; return; }

      container.innerHTML = `<h2>🥋 Techniques</h2>
        <input type="search" class="recherche-tech" id="recherche-tech" placeholder="🔍 Rechercher une technique…" autocomplete="off">
        <p class="recherche-info" id="recherche-info">${techniques.length} techniques</p>
        <div id="liste-tech"></div>`;
      const liste = document.getElementById('liste-tech');
      const info = document.getElementById('recherche-info');

      function afficher(requete) {
        const q = (requete || '').trim();
        // Scores pour cette ceinture et les autres
        const ici = techniques.map(t => ({ t, c: q ? correspond(t, q) : { ok: true, score: 0 } })).filter(x => x.c.ok);
        const autres = [];
        if (q) Object.keys(data).forEach(g => {
          if (g === GRADE) return;
          (data[g] || []).forEach(t => { const c = correspond(t, q); if (c.ok) autres.push({ t, g, c }); });
        });
        // S'il existe des résultats exacts, on n'affiche qu'eux
        const exact = q && (ici.some(x => x.c.score === 0) || autres.some(x => x.c.score === 0));
        const garde = x => !exact || x.c.score === 0;
        let html = '', categorie = '', n = 0;
        ici.filter(garde).forEach(({ t }) => {
          if (t.categorie !== categorie) { categorie = t.categorie; html += `<div class="section-title">${categorie}</div>`; }
          html += ligne(t); n++;
        });
        if (q) {
          const vus = new Set();
          const liste2 = autres.filter(garde).sort((a, b) => a.c.score - b.c.score)
            .filter(a => { const k = a.t.nom + a.g; if (vus.has(k)) return false; vus.add(k); return true; });
          if (!n && !liste2.length) html = '<p style="color:#888;">Aucune technique trouvée.</p>';
          if (liste2.length) {
            html += `<div class="autres-titre">Dans les autres ceintures</div>`;
            liste2.slice(0, 15).forEach(a => { html += ligne(a.t, a.g); });
          }
          info.textContent = `${n} résultat${n > 1 ? 's' : ''} dans cette ceinture` + (exact ? '' : ' (recherche approchée)');
        } else {
          info.textContent = `${techniques.length} techniques`;
        }
        liste.innerHTML = html;
      }

      document.getElementById('recherche-tech').addEventListener('input', e => afficher(e.target.value));
      afficher('');
    })
    .catch(() => { container.innerHTML = '<p style="color:#888;">Techniques à venir.</p>'; });
})();
