const CSV = `Date,High Temperature,Low Temperature
2024-01-02,26,13
2024-01-06,27,14
2024-01-11,28,13
2024-01-16,25,12
2024-01-21,26,11
2024-01-26,27,13
2024-01-31,28,14
2024-02-04,29,15
2024-02-09,30,16
2024-02-14,31,17
2024-02-19,32,18
2024-02-24,33,18
2024-02-29,33,19
2024-03-05,34,20
2024-03-10,36,21
2024-03-15,37,22
2024-03-20,38,23
2024-03-25,39,24
2024-03-30,39,25
2024-04-04,40,26
2024-04-09,41,27
2024-04-14,42,28
2024-04-19,42,29
2024-04-24,41,28
2024-04-29,40,27
2024-05-04,41,29
2024-05-09,42,30
2024-05-14,42,31
2024-05-19,40,30
2024-05-24,39,29
2024-05-29,38,29
2024-06-03,37,28
2024-06-08,36,28
2024-06-13,35,27
2024-06-18,34,27
2024-06-23,33,26
2024-06-28,33,27
2024-07-03,32,27
2024-07-08,31,26
2024-07-13,30,26
2024-07-18,31,27
2024-07-23,32,27
2024-07-28,31,26
2024-08-02,30,26
2024-08-07,29,25
2024-08-12,30,26
2024-08-17,30,25
2024-08-22,29,25
2024-08-27,30,26
2024-09-01,31,26
2024-09-06,32,26
2024-09-11,33,26
2024-09-16,33,25
2024-09-21,34,25
2024-09-26,34,24
2024-10-01,33,24
2024-10-06,35,23
2024-10-11,36,23
2024-10-16,36,22
2024-10-21,35,21
2024-10-26,34,20
2024-10-31,33,19
2024-11-05,33,18
2024-11-10,32,17
2024-11-15,31,16
2024-11-20,30,16
2024-11-25,29,15
2024-11-30,29,15
2024-12-05,28,14
2024-12-10,27,13
2024-12-15,27,12
2024-12-20,26,12
2024-12-25,26,11
2024-12-30,25,11`;
function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  const hdr = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(l => {
    const v = l.split(',').map(s => s.trim());
    const o = {};
    hdr.forEach((h, i) => { o[h] = i === 0 ? v[i] : parseFloat(v[i]); });
    return o;
  }).filter(r => !isNaN(r['High Temperature']));
}
const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MF = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function processData(rows) {
  rows.forEach(r => { r._d = new Date(r.Date + 'T00:00:00'); });
  rows.sort((a, b) => a._d - b._d);

  const last = new Date(rows[rows.length - 1]._d);
  const from = new Date(last.getFullYear(), last.getMonth() - 11, 1);

  const filtered = rows.filter(r => r._d >= from);

  const g = {};
  filtered.forEach(r => {
    const k = r._d.getFullYear() + '-' + String(r._d.getMonth() + 1).padStart(2, '0');
    if (!g[k]) g[k] = { h: [], l: [], d: r._d };
    g[k].h.push(r['High Temperature']);
    g[k].l.push(r['Low Temperature']);
  });

  return Object.keys(g).sort().map(k => {
    const x = g[k];
    const avg = a => Math.round(a.reduce((s, v) => s + v, 0) / a.length * 10) / 10;
    const ah = avg(x.h), al = avg(x.l), m = x.d.getMonth();
    return {
      key: k, label: MN[m], full: MF[m], yr: x.d.getFullYear(),
      ah, al, diff: Math.round((ah - al) * 10) / 10
    };
  });
}
function renderStats(d) {
  const mxH = Math.max(...d.map(x => x.ah));
  const mnL = Math.min(...d.map(x => x.al));
  const all = d.flatMap(x => [x.ah, x.al]);
  const avg = Math.round(all.reduce((s, v) => s + v, 0) / all.length * 10) / 10;
  const mxR = Math.max(...d.map(x => x.diff));
  const items = [
    { ico: 'fa-temperature-high', c: 'h', v: mxH + '°C', l: 'Peak High' },
    { ico: 'fa-temperature-low', c: 'l', v: mnL + '°C', l: 'Lowest Low' },
    { ico: 'fa-chart-line', c: 'a', v: avg + '°C', l: 'Overall Avg' },
    { ico: 'fa-arrows-up-down', c: 'r', v: mxR + '°C', l: 'Max Range' },
  ];
  document.getElementById('stats').innerHTML = items.map(i => `
    <div class="st">
      <div class="st-ico ${i.c}"><i class="fas ${i.ico}"></i></div>
      <div class="st-val">${i.v}</div>
      <div class="st-lbl">${i.l}</div>
    </div>`).join('');
}
let chart = null;

function makeChart(d) {
  const s = getComputedStyle(document.documentElement);
  const c = {
    hi: s.getPropertyValue('--high').trim(),
    lo: s.getPropertyValue('--low').trim(),
    hiBg: s.getPropertyValue('--high-bg').trim(),
    loBg: s.getPropertyValue('--low-bg').trim(),
    fg: s.getPropertyValue('--fg').trim(),
    mt: s.getPropertyValue('--muted').trim(),
    bd: s.getPropertyValue('--border').trim(),
  };
  if (chart) chart.destroy();
  const ctx = document.getElementById('chart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: d.map(x => x.label),
      datasets: [
        {
          label: 'High Temperature (°C)', data: d.map(x => x.ah),
          borderColor: c.hi, backgroundColor: c.hiBg, borderWidth: 3,
          pointRadius: 5, pointHoverRadius: 9,
          pointBackgroundColor: c.hi, pointBorderColor: '#fff', pointBorderWidth: 2,
          pointHoverBorderColor: '#fff', pointHoverBorderWidth: 3,
          fill: true, tension: .4,
        },
        {
          label: 'Low Temperature (°C)', data: d.map(x => x.al),
          borderColor: c.lo, backgroundColor: c.loBg, borderWidth: 3,
          pointRadius: 5, pointHoverRadius: 9,
          pointBackgroundColor: c.lo, pointBorderColor: '#fff', pointBorderWidth: 2,
          pointHoverBorderColor: '#fff', pointHoverBorderWidth: 3,
          fill: true, tension: .4,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(12,14,20,.93)',
          titleColor: '#eeeae2', bodyColor: '#a09caf',
          borderColor: 'rgba(255,255,255,.07)', borderWidth: 1,
          cornerRadius: 10, padding: 13,
          titleFont: { family: 'Space Grotesk', size: 13.5, weight: '600' },
          bodyFont: { family: 'DM Sans', size: 12.5 },
          boxPadding: 5,
          callbacks: {
            title: items => { const i = items[0].dataIndex; return d[i].full + ' ' + d[i].yr; },
            label: ctx => ' ' + ctx.dataset.label + ': ' + ctx.parsed.y + '°C'
          }
        }
      },
      scales: {
        x: {
          grid: { color: c.bd, drawBorder: false },
          ticks: { color: c.mt, font: { family: 'DM Sans', size: 11.5, weight: '500' }, padding: 6 },
          border: { display: false }
        },
        y: {
          min: Math.min(...d.map(x => x.al)) - 4,
          max: Math.max(...d.map(x => x.ah)) + 4,
          grid: { color: c.bd, drawBorder: false },
          ticks: { color: c.mt, font: { family: 'Space Grotesk', size: 11.5 }, padding: 10, callback: v => v + '°', stepSize: 5 },
          border: { display: false }
        }
      },
      animation: { duration: 1100, easing: 'easeOutQuart' }
    }
  });
}
function renderTable(d) {
  const mxH = Math.max(...d.map(x => x.ah));
  const f = d[0], l = d[d.length - 1];
  document.getElementById('tblRange').textContent = f.full + ' ' + f.yr + ' — ' + l.full + ' ' + l.yr;
  document.getElementById('tbody').innerHTML = d.map(x => {
    const bw = Math.max(8, x.ah / mxH * 100);
    return `<tr>
      <td class="mn">${x.full} ${x.yr}</td>
      <td class="th">${x.ah}°C</td>
      <td class="tl">${x.al}°C</td>
      <td class="bar-cell"><div class="bar-w">
        <div class="bar-track"><div class="bar-fill" data-w="${bw}"></div></div>
        <span class="bar-diff">${x.diff}°</span>
      </div></td>
    </tr>`;
  }).join('');
  requestAnimationFrame(() => {
    document.querySelectorAll('.bar-fill').forEach(b => {
      const w = b.dataset.w;
      b.style.width = '0%';
      requestAnimationFrame(() => { b.style.width = w + '%'; });
    });
  });
}
function initTheme() {
  const s = localStorage.getItem('wvTheme');
  if (s) document.documentElement.setAttribute('data-theme', s);
  updIco();
}

function togTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const nxt = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', nxt);
  localStorage.setItem('wvTheme', nxt);
  updIco();
  if (pData) setTimeout(() => makeChart(pData), 60);
}

function updIco() {
  const dk = document.documentElement.getAttribute('data-theme') === 'dark';
  document.getElementById('swIco').className = dk ? 'fas fa-moon' : 'fas fa-sun';
}

document.getElementById('sw').addEventListener('click', togTheme);

document.addEventListener('keydown', e => {
  if (e.key === 't' && !e.ctrlKey && !e.metaKey &&
    !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    togTheme();
  }
});
function mkPtc() {
  const c = document.getElementById('ptcWrap');
  for (let i = 0; i < 16; i++) {
    const p = document.createElement('div');
    p.className = 'ptc';
    const sz = Math.random() * 2.8 + 1.2;
    p.style.cssText =
      'width:' + sz + 'px;height:' + sz + 'px;left:' + Math.random() * 100 + '%;' +
      'background:' + (Math.random() > .5 ? 'var(--accent)' : 'var(--low)') + ';' +
      'animation-duration:' + (Math.random() * 16 + 14) + 's;' +
      'animation-delay:' + (Math.random() * 18) + 's;' +
      'filter:blur(' + (sz > 2.2 ? 1 : 0) + 'px)';
    c.appendChild(p);
  }
}
function initRv() {
  const obs = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('show');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: .12, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.rv').forEach(el => obs.observe(el));
}
let pData = null;

function boot() {
  initTheme();
  mkPtc();
  setTimeout(() => {
    const rows = parseCSV(CSV);
    pData = processData(rows);
    renderStats(pData);
    makeChart(pData);
    renderTable(pData);
    initRv();
    document.getElementById('loader').classList.add('off');
  }, 700);
}

boot();