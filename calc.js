/* Fortune Bridge — Wealth Calculator.
   Two modes: "goal" (what does my target need) and "grow" (what does my amount become).
   Two investment types: monthly SIP, one-time lumpsum. Three return scenarios.
   The chart, the tiles and the table are all derived from the same series() call, so they
   can never disagree. No dependencies. */

(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Fixed order, fixed colour: these are identities, never re-ranked.
  const SCEN = [
    { key: 'cautious', name: 'Cautious', rate: 0.10 },
    { key: 'balanced', name: 'Balanced', rate: 0.12 },
    { key: 'growth',   name: 'Growth',   rate: 0.14 }
  ];

  const state = { mode: 'goal', type: 'sip', target: 5e7, sip: 25000, lump: 1e6, years: 10, scen: 1 };

  /* ---------- formatting (Indian grouping) ---------- */
  const inr = n => Math.round(n).toLocaleString('en-IN');
  const trim = s => s.replace(/\.?0+$/, '');
  function compact(n) {
    if (n >= 1e7) return '₹' + trim((n / 1e7).toFixed(2)) + ' Cr';
    if (n >= 1e5) return '₹' + trim((n / 1e5).toFixed(2)) + ' L';
    return '₹' + inr(n);
  }
  const money = n => '₹' + inr(n);

  /* ---------- maths ---------- */
  // SIP: instalments at the START of each month, compounding monthly at r/12.
  const fvSip   = (p, r, y)  => { const i = r / 12, m = y * 12; return p * ((Math.pow(1 + i, m) - 1) / i) * (1 + i); };
  const sipFor  = (fv, r, y) => fv / (((Math.pow(1 + r / 12, y * 12) - 1) / (r / 12)) * (1 + r / 12));
  // Lumpsum: compounds once a year.
  const fvLump  = (pv, r, y) => pv * Math.pow(1 + r, y);
  const lumpFor = (fv, r, y) => fv / Math.pow(1 + r, y);

  // The single source of truth: per-year invested + value for one scenario.
  function series(rate) {
    const out = [];
    if (state.type === 'sip') {
      const p = state.mode === 'goal' ? sipFor(state.target, rate, state.years) : state.sip;
      for (let y = 1; y <= state.years; y++) {
        const inv = p * 12 * y, val = fvSip(p, rate, y);
        out.push({ y, inv, val, gain: val - inv });
      }
      out.input = p;
    } else {
      const pv = state.mode === 'goal' ? lumpFor(state.target, rate, state.years) : state.lump;
      for (let y = 1; y <= state.years; y++) {
        const val = fvLump(pv, rate, y);
        out.push({ y, inv: pv, val, gain: val - pv });
      }
      out.input = pv;
    }
    return out;
  }

  /* ---------- inputs ---------- */
  const el = {
    target: $('#target'), targetNum: $('#targetNum'), targetOut: $('#targetOut'),
    amount: $('#amount'), amountNum: $('#amountNum'), amountOut: $('#amountOut'),
    amountLabel: $('#amountLabel'), amountMin: $('#amountMin'), amountMax: $('#amountMax'),
    years: $('#years'), yearsOut: $('#yearsOut'),
    tiles: $('#tiles'), resultsTitle: $('#resultsTitle'), chartTitle: $('#chartTitle'),
    svg: $('#calcSvg'), tip: $('#ctip'), tbody: $('#calcTable tbody')
  };

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  // The amount boxes are text fields so they can show Indian grouping (5,00,00,000).
  const parseNum = s => +String(s).replace(/[^\d]/g, '') || 0;
  const showNum = (input, v) => { input.value = inr(v); };

  function syncAmountBounds() {
    if (state.type === 'sip') {
      el.amount.min = 500; el.amount.max = 500000; el.amount.step = 500;
      el.amountNum.dataset.min = 500;
      el.amount.value = state.sip; showNum(el.amountNum, state.sip);
      el.amountLabel.textContent = 'Monthly SIP';
      el.amountMin.textContent = '₹500'; el.amountMax.textContent = '₹5 L';
    } else {
      el.amount.min = 50000; el.amount.max = 100000000; el.amount.step = 50000;
      el.amountNum.dataset.min = 50000;
      el.amount.value = state.lump; showNum(el.amountNum, state.lump);
      el.amountLabel.textContent = 'One-time amount';
      el.amountMin.textContent = '₹50,000'; el.amountMax.textContent = '₹10 Cr';
    }
  }

  el.target.addEventListener('input', () => { state.target = +el.target.value; showNum(el.targetNum, state.target); render(); });
  el.targetNum.addEventListener('change', () => {
    state.target = clamp(parseNum(el.targetNum.value) || 1e5, 1e5, 1e10);
    showNum(el.targetNum, state.target); el.target.value = clamp(state.target, +el.target.min, +el.target.max); render();
  });
  el.amount.addEventListener('input', () => { setAmount(+el.amount.value); showNum(el.amountNum, +el.amount.value); render(); });
  el.amountNum.addEventListener('change', () => {
    const lo = +el.amountNum.dataset.min;
    const v = clamp(parseNum(el.amountNum.value) || lo, lo, 1e10);
    setAmount(v); showNum(el.amountNum, v);
    el.amount.value = clamp(v, +el.amount.min, +el.amount.max); render();
  });
  function setAmount(v) { if (state.type === 'sip') state.sip = v; else state.lump = v; }
  el.years.addEventListener('input', () => { state.years = +el.years.value; render(); });

  document.querySelectorAll('.calc-tab').forEach(b => b.addEventListener('click', () => {
    state.mode = b.dataset.mode;
    document.querySelectorAll('.calc-tab').forEach(x => { const on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-selected', on); });
    document.querySelectorAll('[data-show]').forEach(f => f.hidden = f.dataset.show !== state.mode);
    render();
  }));
  document.querySelectorAll('.seg-btn').forEach(b => b.addEventListener('click', () => {
    state.type = b.dataset.type;
    document.querySelectorAll('.seg-btn').forEach(x => { const on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-checked', on); });
    syncAmountBounds(); render();
  }));

  /* ---------- tiles ---------- */
  function renderTiles(all) {
    el.tiles.innerHTML = '';
    all.forEach((s, i) => {
      const d = s.data, last = d[d.length - 1];
      const head = state.mode === 'goal'
        ? (state.type === 'sip' ? money(d.input) : compact(d.input))
        : compact(last.val);
      const unit = state.mode === 'goal' && state.type === 'sip' ? '<small>/month</small>' : '';
      const b = document.createElement('button');
      b.className = 'tile' + (i === state.scen ? ' active' : '');
      b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', i === state.scen);
      b.dataset.i = i;
      b.innerHTML =
        `<div class="tile-head"><span class="tile-name">${s.name}</span><span class="tile-rate">${Math.round(s.rate * 100)}% a year</span></div>
         <div class="tile-value">${head}${unit}</div>
         <div class="tile-sub">Invest ${compact(last.inv)} in total<br>Growth adds ${compact(last.gain)}</div>`;
      b.addEventListener('click', () => { state.scen = i; render(); });
      el.tiles.appendChild(b);
    });
  }

  /* ---------- chart ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (t, a) => { const n = document.createElementNS(NS, t); for (const k in a) n.setAttribute(k, a[k]); return n; };
  const W = 600, H = 264, PL = 56, PR = 16, PT = 30, PB = 30;
  const plotW = W - PL - PR, base = H - PB, plotH = base - PT;

  // Finer steps than the usual 1/2/5/10 so the goal sits near the top of the plot instead
  // of leaving half the chart empty (a ₹5 Cr goal used to get a ₹10 Cr axis).
  function niceCeil(v) {
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const f = v / p;
    const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
    return (steps.find(s => f <= s) || 10) * p;
  }

  let lastN = -1;
  function renderChart(d, scenName) {
    const svg = el.svg;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const max = niceCeil(d[d.length - 1].val * 1.06);
    const yFor = v => base - (v / max) * plotH;
    const n = d.length, band = plotW / n, bw = Math.min(24, band * 0.62);
    const xFor = i => PL + i * band + (band - bw) / 2;

    const rebuild = n !== lastN;
    if (rebuild) { svg.innerHTML = ''; lastN = n; }

    // grid + axis (hairline, solid, recessive)
    let g = svg.querySelector('.grid');
    if (!g) { g = mk('g', { class: 'grid' }); svg.appendChild(g); }
    g.innerHTML = '';
    for (let k = 0; k <= 4; k++) {
      const v = max * k / 4, y = yFor(v);
      g.appendChild(mk('line', { class: 'gl' + (k === 0 ? ' base' : ''), x1: PL, y1: y, x2: W - PR, y2: y }));
      const t = mk('text', { class: 'ax', x: PL - 8, y: y + 3.5, 'text-anchor': 'end' });
      t.textContent = k === 0 ? '0' : compact(v).replace('₹', '');
      g.appendChild(t);
    }

    // bars: growth (gold, rounded cap) drawn full height, invested (blue, square) on top from
    // the baseline, then a 2px SURFACE gap at the junction. Everything is a rect, so the CSS
    // transitions on y/height animate between states.
    let bars = svg.querySelector('.bars');
    if (!bars) { bars = mk('g', { class: 'bars' }); svg.appendChild(bars); }
    d.forEach((r, i) => {
      let grp = bars.children[i];
      if (!grp) {
        grp = mk('g', { class: 'cbar' });
        grp.appendChild(mk('rect', { class: 'r-gr', rx: 4, y: base, height: 0 }));
        grp.appendChild(mk('rect', { class: 'r-inv', y: base, height: 0 }));
        grp.appendChild(mk('rect', { class: 'r-gap', y: base, height: 0 }));
        bars.appendChild(grp);
      }
      const [gr, inv, gap] = grp.children;
      const x = xFor(i);
      const yTot = yFor(r.val), yInv = yFor(r.inv);
      const set = () => {
        gr.setAttribute('x', x); gr.setAttribute('width', bw); gr.setAttribute('y', yTot); gr.setAttribute('height', Math.max(0, base - yTot));
        inv.setAttribute('x', x); inv.setAttribute('width', bw); inv.setAttribute('y', yInv); inv.setAttribute('height', Math.max(0, base - yInv));
        const showGap = r.gain > 0 && (yInv - yTot) > 3;
        gap.setAttribute('x', x); gap.setAttribute('width', bw); gap.setAttribute('y', yInv - 2); gap.setAttribute('height', showGap ? 2 : 0);
      };
      if (rebuild && !reduce) requestAnimationFrame(() => requestAnimationFrame(set)); else set();
    });

    // year labels: every year up to 12, else every 5th plus the last
    let xl = svg.querySelector('.xl');
    if (!xl) { xl = mk('g', { class: 'xl' }); svg.appendChild(xl); }
    xl.innerHTML = '';
    d.forEach((r, i) => {
      const show = n <= 12 || r.y % 5 === 0 || i === n - 1 || i === 0;
      if (!show) return;
      const t = mk('text', { class: 'ax xa' + (i === n - 1 ? ' final' : ''), x: xFor(i) + bw / 2, y: base + 18, 'text-anchor': 'middle' });
      t.textContent = 'Y' + r.y;
      xl.appendChild(t);
    });

    // one direct label: the endpoint
    let end = svg.querySelector('.endlab');
    if (!end) { end = mk('text', { class: 'endlab' }); svg.appendChild(end); }
    const last = d[n - 1], lx = xFor(n - 1) + bw / 2;
    end.setAttribute('x', Math.min(lx, W - PR - 4));
    end.setAttribute('y', yFor(last.val) - 9);
    end.setAttribute('text-anchor', lx > W - 90 ? 'end' : 'middle');
    end.textContent = compact(last.val);

    // hover / focus layer: one hit target per year, full plot height, at least the band wide
    let hits = svg.querySelector('.hits');
    if (!hits) { hits = mk('g', { class: 'hits' }); svg.appendChild(hits); }
    hits.innerHTML = '';
    d.forEach((r, i) => {
      const hx = PL + i * band;
      const h = mk('rect', { class: 'hit', x: hx, y: PT - 10, width: band, height: plotH + 10, tabindex: 0, role: 'img',
        'aria-label': `Year ${r.y}: invested ${money(r.inv)}, growth ${money(r.gain)}, value ${money(r.val)}` });
      const show = () => {
        bars.querySelectorAll('.cbar').forEach((c, j) => c.classList.toggle('dim', j !== i));
        el.tip.innerHTML = `<b>Year ${r.y}</b><span><i class="sw sw-inv"></i>Invested <em>${money(r.inv)}</em></span><span><i class="sw sw-gr"></i>Growth <em>${money(r.gain)}</em></span><span class="tot">Value <em>${money(r.val)}</em></span>`;
        el.tip.hidden = false;
        const rect = svg.getBoundingClientRect(), scale = rect.width / W;
        const px = (hx + band / 2) * scale, py = yFor(r.val) * scale;
        el.tip.style.left = clamp(px, 90, rect.width - 90) + 'px';
        el.tip.style.top = Math.max(8, py - 12) + 'px';
      };
      h.addEventListener('pointerenter', show); h.addEventListener('focus', show);
      h.addEventListener('pointerleave', hideAll); h.addEventListener('blur', hideAll);
      hits.appendChild(h);
    });
    function hideAll() { el.tip.hidden = true; bars.querySelectorAll('.cbar').forEach(c => c.classList.remove('dim')); }

    el.chartTitle.textContent = `Year by year, ${scenName} scenario`;
  }

  /* ---------- table (the WCAG twin of the chart) ---------- */
  function renderTable(d) {
    el.tbody.innerHTML = d.map(r =>
      `<tr><td>${r.y}</td><td>${money(r.inv)}</td><td>${money(r.gain)}</td><td>${money(r.val)}</td></tr>`).join('');
  }

  /* ---------- titles ---------- */
  function title() {
    const yrs = `${state.years} year${state.years > 1 ? 's' : ''}`;
    if (state.mode === 'goal') {
      return (state.type === 'sip' ? 'Monthly SIP needed' : 'One-time amount needed') + ` to reach ${compact(state.target)} in ${yrs}`;
    }
    const amt = state.type === 'sip' ? `${money(state.sip)} a month` : `${compact(state.lump)} today`;
    return `What ${amt} grows to in ${yrs}`;
  }

  /* ---------- render everything from state ---------- */
  function render() {
    el.targetOut.textContent = compact(state.target);
    el.amountOut.textContent = state.type === 'sip' ? money(state.sip) : compact(state.lump);
    el.yearsOut.textContent = `${state.years} year${state.years > 1 ? 's' : ''}`;
    el.resultsTitle.textContent = title();

    const all = SCEN.map(s => Object.assign({}, s, { data: series(s.rate) }));
    renderTiles(all);
    const active = all[state.scen];
    renderChart(active.data, active.name);
    renderTable(active.data);

    // One line the consultation form can carry into its message field.
    window.fbCalcSummary = title() + '. ' + all.map(s => {
      const d = s.data, last = d[d.length - 1];
      const v = state.mode === 'goal'
        ? (state.type === 'sip' ? money(d.input) + ' a month' : compact(d.input) + ' once')
        : compact(last.val);
      return s.name + ' ' + Math.round(s.rate * 100) + '%: ' + v;
    }).join('; ') + '.';
  }

  document.querySelectorAll('[data-show]').forEach(f => f.hidden = f.dataset.show !== state.mode);
  syncAmountBounds();
  showNum(el.targetNum, state.target);
  render();
})();
