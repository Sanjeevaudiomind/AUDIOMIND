// ---------- mobile nav ----------
document.addEventListener('DOMContentLoaded', () => {
  const hb = document.querySelector('.hamburger');
  const links = document.querySelector('.nav-links');
  if (hb && links) {
    hb.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }

  // ---------- scroll reveal ----------
  const els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .15 });
    els.forEach(el => io.observe(el));
  } else {
    els.forEach(el => el.classList.add('in'));
  }

  // ---------- draw audiogram(s) ----------
  document.querySelectorAll('[data-audiogram]').forEach(drawAudiogram);
});

// Draws a stylised audiogram: frequency (Hz) across x, hearing threshold (dB) down y.
// Two plotted curves represent left/right ear thresholds — purely illustrative/brand motif.
function drawAudiogram(container) {
  const w = container.clientWidth || 480, h = 220;
  const freqs = ['125', '250', '500', '1k', '2k', '4k', '8k'];
  const padL = 34, padR = 14, padT = 14, padB = 26;
  const plotW = w - padL - padR, plotH = h - padT - padB;
  const xFor = i => padL + (i / (freqs.length - 1)) * plotW;
  const yFor = db => padT + (db / 100) * plotH; // 0-100 dB scale

  const rightPts = [10, 15, 20, 25, 35, 45, 40];
  const leftPts = [15, 20, 25, 35, 50, 55, 50];

  const toPath = pts => pts.map((db, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(db).toFixed(1)}`).join(' ');

  let gridLines = '';
  for (let db = 0; db <= 100; db += 20) {
    const y = yFor(db).toFixed(1);
    gridLines += `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="#2A3336" stroke-width="1" opacity="0.5"/>`;
    gridLines += `<text x="${padL - 8}" y="${Number(y) + 3}" font-family="IBM Plex Mono, monospace" font-size="9" fill="#8A9296" text-anchor="end">${db}</text>`;
  }
  let xLabels = '';
  freqs.forEach((f, i) => {
    xLabels += `<text x="${xFor(i).toFixed(1)}" y="${h - 6}" font-family="IBM Plex Mono, monospace" font-size="9" fill="#8A9296" text-anchor="middle">${f}</text>`;
  });

  const svg = `
  <svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" xmlns="http://www.w3.org/2000/svg">
    ${gridLines}${xLabels}
    <path d="${toPath(rightPts)}" fill="none" stroke="#E8A33D" stroke-width="2"/>
    <path d="${toPath(leftPts)}" fill="none" stroke="#1F6F63" stroke-width="2" stroke-dasharray="4 3"/>
    ${rightPts.map((db, i) => `<circle cx="${xFor(i)}" cy="${yFor(db)}" r="3.5" fill="#E8A33D"/>`).join('')}
    ${leftPts.map((db, i) => `<circle cx="${xFor(i)}" cy="${yFor(db)}" r="3.5" fill="none" stroke="#1F6F63" stroke-width="2"/>`).join('')}
  </svg>`;
  container.innerHTML = svg;
}
