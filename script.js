/* Fortune Bridge — homepage interactions & entrance animations.
   No dependencies. Everything degrades gracefully without JS (content is all in the HTML;
   reveal elements are shown by the fallback below if the observer never runs). */

(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- header shadow on scroll ---- */
  const header = document.getElementById('header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- generic scroll reveal ---- */
  // Only hide what's BELOW the fold. Anything visible on load stays visible, so the first
  // frame (thumbnails, shared previews) is never blank. Elements are shown by default in CSS.
  const reveals = document.querySelectorAll('[data-reveal]');
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.remove('pending'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    const fold = window.innerHeight;
    reveals.forEach(el => {
      if (el.getBoundingClientRect().top > fold) { el.classList.add('pending'); io.observe(el); }
    });
  }

  /* ---- count-up numbers ---- */
  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const comma = el.hasOwnProperty('comma') || el.dataset.comma !== undefined;
    const dur = 1400, t0 = performance.now();
    const fmt = n => (comma ? Math.round(n).toLocaleString('en-IN') : Math.round(n).toString());
    function frame(now) {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + fmt(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  document.querySelectorAll('[data-count]').forEach(el => {
    if (reduce) { // show final value immediately
      const comma = el.dataset.comma !== undefined;
      el.textContent = (el.dataset.prefix || '') +
        (comma ? Number(el.dataset.count).toLocaleString('en-IN') : el.dataset.count) +
        (el.dataset.suffix || '');
      return;
    }
    const io = new IntersectionObserver((ents, obs) => {
      ents.forEach(e => { if (e.isIntersecting) { countUp(el); obs.unobserve(el); } });
    }, { threshold: 0.6 });
    io.observe(el);
  });

  /* ---- outlook chart ---- */
  const SVGNS = 'http://www.w3.org/2000/svg';
  const svg = document.getElementById('chart-svg');
  if (svg) {
    // ONE source of truth for the panel. The chart, the ₹ chip and the "% funded" line in
    // the callout are all derived from this, so they can never contradict each other.
    // This is goal PROGRESS (amount accumulated toward a target), never a rate of return.
    const GOAL = 70;                                   // ₹ lakh
    const DATA = [
      { year: '2025', v: 12 }, { year: '2026', v: 18 }, { year: '2027', v: 26 },
      { year: '2028', v: 35 }, { year: '2029', v: 47 }, { year: '2030', v: 62 }
    ];
    const FINAL = DATA[DATA.length - 1].v;
    const PCT = Math.round(FINAL / GOAL * 100);
    const W = 398, H = 200, AXIS = 40, PLOT_X = 44, PLOT_W = W - PLOT_X;
    const BASE = 168, MAXV = 78, BW = 38;              // MAXV > GOAL leaves room for the goal line + label
    const GAP = (PLOT_W - DATA.length * BW) / (DATA.length - 1);
    const yFor = v => BASE - (v / MAXV) * BASE;
    const xFor = i => PLOT_X + i * (BW + GAP);
    const mk = (tag, attrs) => {
      const n = document.createElementNS(SVGNS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      return n;
    };

    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.removeAttribute('preserveAspectRatio');

    // gridlines + value axis
    [0, 20, 40, 60].forEach(val => {
      const y = yFor(val);
      svg.appendChild(mk('line', { class: 'gridline' + (val === 0 ? ' base' : ''),
        x1: PLOT_X, y1: y, x2: W, y2: y }));
      const lab = mk('text', { class: 'axis-label', x: AXIS - 6, y: y + 3, 'text-anchor': 'end' });
      lab.textContent = val === 0 ? '₹0' : '₹' + val + 'L';
      svg.appendChild(lab);
    });

    // goal line: the target the bars are climbing toward
    const gy = yFor(GOAL);
    svg.appendChild(mk('line', { class: 'goal-line', x1: PLOT_X, y1: gy, x2: W, y2: gy }));
    const gl = mk('text', { class: 'goal-label', x: PLOT_X + 2, y: gy - 6 });
    gl.textContent = 'Goal ₹' + GOAL + 'L';
    svg.appendChild(gl);

    // bars
    const tops = [];
    DATA.forEach((d, i) => {
      const h = (d.v / MAXV) * BASE, x = xFor(i), last = i === DATA.length - 1;
      const bar = mk('rect', {
        class: 'bar', x, y: BASE - h, width: BW, height: h, rx: 5,
        fill: last ? 'url(#barGold)' : 'url(#barGhost)'
      });
      bar.style.transitionDelay = (0.26 + i * 0.09) + 's';
      svg.appendChild(bar);
      tops.push([x + BW / 2, BASE - h]);

      const yl = mk('text', { class: 'year-label' + (last ? ' final' : ''),
        x: x + BW / 2, y: BASE + 16 });
      yl.textContent = d.year;
      svg.appendChild(yl);
    });

    // gradients
    const defs = mk('defs', {});
    const g1 = mk('linearGradient', { id: 'barGhost', x1: 0, y1: 1, x2: 0, y2: 0 });
    g1.appendChild(mk('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': .1 }));
    g1.appendChild(mk('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': .24 }));
    const g2 = mk('linearGradient', { id: 'barGold', x1: 0, y1: 1, x2: 0, y2: 0 });
    g2.appendChild(mk('stop', { offset: 0, 'stop-color': '#d4af37' }));
    g2.appendChild(mk('stop', { offset: 1, 'stop-color': '#ebd48f' }));
    defs.appendChild(g1); defs.appendChild(g2);
    svg.insertBefore(defs, svg.firstChild);

    // trend line + dots
    const d = tops.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
    const line = mk('path', { class: 'trend-line', d });
    svg.appendChild(line);
    const dots = tops.map(p => {
      const c = mk('circle', { class: 'trend-dot', cx: p[0], cy: p[1], r: 3.5 });
      c.style.opacity = 0; c.style.transform = 'scale(0)';
      c.style.transformBox = 'fill-box'; c.style.transformOrigin = 'center';
      c.style.transition = 'opacity .3s ease, transform .35s cubic-bezier(.34,1.56,.64,1)';
      svg.appendChild(c); return c;
    });

    // trend draw-on setup
    const len = line.getTotalLength();
    line.style.strokeDasharray = len;
    line.style.strokeDashoffset = reduce ? 0 : len;
    line.style.transition = 'stroke-dashoffset .8s ease-out .75s';

    // value chip: sits ON the final data point (an enlarged trend dot), so it reads as the
    // end of the line and the top of the bar. Floating it above collided with the goal line.
    const chip = document.querySelector('.value-chip');
    const lastTop = tops[tops.length - 1];
    chip.style.left = (lastTop[0] / W * 100) + '%';
    chip.style.top = (lastTop[1] / H * 100) + '%';

    // callout line, derived from the same data as the bars
    const prog = document.querySelector('[data-goal-progress]');
    if (prog) prog.textContent = PCT + '% of the ₹' + GOAL + 'L goal funded, reviewed quarterly';

    function runChart() {
      document.getElementById('chart').classList.add('run');
      if (reduce) { dots.forEach(c => { c.style.opacity = 1; c.style.transform = 'scale(1)'; });
        chip.classList.add('show');
        document.querySelector('[data-chip]').textContent = FINAL; return; }
      line.style.strokeDashoffset = 0;
      dots.forEach((c, i) => setTimeout(() => {
        c.style.opacity = 1; c.style.transform = 'scale(1)';
        if (i === dots.length - 1) chip.classList.add('show');
      }, 850 + i * 90));
      // chip count-up as the line lands
      setTimeout(() => {
        const chipEl = document.querySelector('[data-chip]');
        const t0 = performance.now(), dur = 600;
        (function f(now) {
          const p = Math.min(1, (now - t0) / dur);
          chipEl.textContent = Math.round(FINAL * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(f);
        })(performance.now());
      }, 1000);
    }

    if (reduce || !('IntersectionObserver' in window)) {
      runChart();
    } else {
      const io = new IntersectionObserver((ents, obs) => {
        ents.forEach(e => { if (e.isIntersecting) { runChart(); obs.disconnect(); } });
      }, { threshold: 0.4 });
      io.observe(document.getElementById('outlook'));
    }
  }
})();

/* ============================================================
   Consultation form (modal). Injected here so both pages share one source.
   Sending: a static site cannot email by itself, so the form posts to FormSubmit, a
   form-to-email relay. Vignesh must click the one-time activation link FormSubmit emails
   him on the FIRST submission; until then nothing is delivered. If the relay is unreachable
   (offline, blocked, or the hosted preview's strict CSP) the form falls back to opening
   the visitor's own mail app pre-filled, so it never dead-ends.
   ============================================================ */
(function () {
  'use strict';
  const TO = 'vignesh@fortunebridge.co.in';
  const ENDPOINT = 'https://formsubmit.co/ajax/' + TO;   // swap for a Formspree URL if preferred
  const TOPICS = ['Mutual Funds', 'SIF', 'PMS', 'AIF', 'Bonds', 'Insurance', 'LAMF', 'Not sure yet, a general plan'];

  const dlg = document.createElement('dialog');
  dlg.className = 'book';
  dlg.id = 'book';
  dlg.setAttribute('aria-labelledby', 'bookTitle');
  dlg.innerHTML =
    '<form class="book-form" method="post" novalidate>' +
      '<button type="button" class="book-close" aria-label="Close">×</button>' +
      '<p class="eyebrow">Book a consultation</p>' +
      '<h2 id="bookTitle">Tell us a little about you</h2>' +
      '<p class="book-sub">We will call or write back within one working day.</p>' +
      '<div class="book-grid">' +
        '<label>Name<input name="name" required autocomplete="name" maxlength="80"></label>' +
        '<label>Phone<input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+91" maxlength="20"></label>' +
      '</div>' +
      '<label>Email<input name="email" type="email" autocomplete="email" maxlength="120"></label>' +
      '<p class="book-hint">Phone or email, at least one, so we can reach you.</p>' +
      '<label>What would you like to discuss?<select name="topic">' +
        TOPICS.map(t => '<option>' + t + '</option>').join('') +
      '</select></label>' +
      '<label>Anything we should know? <span class="opt">(optional)</span><textarea name="message" rows="3" maxlength="1500"></textarea></label>' +
      '<label class="book-consent"><input type="checkbox" name="consent" required><span>I agree to be contacted by Fortune Bridge about this request.</span></label>' +
      '<input type="text" name="_honey" class="book-honey" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<div class="book-actions">' +
        '<button type="submit" class="btn btn-primary">Send request</button>' +
        '<button type="button" class="btn-ghost-dark book-cancel">Cancel</button>' +
      '</div>' +
      '<p class="book-status" role="status" aria-live="polite"></p>' +
    '</form>' +
    '<div class="book-done" hidden>' +
      '<span class="book-tick"><svg class="ic"><use href="#i-check"/></svg></span>' +
      '<h2>Request sent</h2>' +
      '<p>Thank you. The Fortune Bridge team will contact you soon.</p>' +
      '<button type="button" class="btn btn-primary book-close2">Done</button>' +
    '</div>';
  document.body.appendChild(dlg);

  const form = dlg.querySelector('.book-form');
  const done = dlg.querySelector('.book-done');
  const status = dlg.querySelector('.book-status');
  const submitBtn = form.querySelector('[type=submit]');
  const msgField = form.elements.message;
  const phoneEl = form.elements.phone, emailEl = form.elements.email;

  // Either contact channel is enough, but we need one. Both fields carry the same custom
  // validity so whichever the visitor reaches first shows the problem.
  function checkContact() {
    const phone = phoneEl.value.trim(), email = emailEl.value.trim();
    const msg = (phone || email) ? '' : 'Please give a phone number or an email so we can reach you.';
    phoneEl.setCustomValidity(msg); emailEl.setCustomValidity(msg);
    if (phone && phone.replace(/\D/g, '').length < 8) phoneEl.setCustomValidity('Please enter a valid phone number.');
  }
  phoneEl.addEventListener('input', checkContact);
  emailEl.addEventListener('input', checkContact);

  function open() {
    form.hidden = false; done.hidden = true; status.textContent = ''; form.classList.remove('touched');
    checkContact();
    // On the calculator page, carry the visitor's result into the message.
    if (!msgField.value && window.fbCalcSummary) msgField.value = 'From the Wealth Calculator: ' + window.fbCalcSummary;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    form.elements.name.focus();
  }
  function close() { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }

  document.querySelectorAll('[data-book]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); open(); }));
  dlg.querySelector('.book-close').addEventListener('click', close);
  dlg.querySelector('.book-cancel').addEventListener('click', close);
  dlg.querySelector('.book-close2').addEventListener('click', close);
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });   // backdrop

  const enc = encodeURIComponent;
  function mailtoHref(d) {
    const body = 'Name: ' + d.name + '\nPhone: ' + (d.phone || '-') + '\nEmail: ' + (d.email || '-') +
      '\nTopic: ' + d.topic + '\n\n' + (d.message || '');
    return 'mailto:' + TO + '?subject=' + enc('Consultation request from ' + d.name) + '&body=' + enc(body);
  }
  function fail(d) {
    submitBtn.disabled = false; submitBtn.textContent = 'Send request';
    status.innerHTML = '';
    status.append('We could not send this automatically. ');
    const a = document.createElement('a');
    a.href = mailtoHref(d); a.textContent = 'Open your email app instead';
    status.append(a, ' and your details will be filled in.');
  }
  function succeed() {
    form.hidden = true; done.hidden = false; form.reset();
    dlg.querySelector('.book-close2').focus();
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    form.classList.add('touched');
    checkContact();
    if (!form.checkValidity()) {
      const inv = form.querySelector(':invalid');
      status.textContent = inv.validationMessage || 'Please check the highlighted field.';
      inv.focus(); return;
    }
    const d = Object.fromEntries(new FormData(form));
    if (d._honey) { succeed(); return; }               // bot filled the hidden field
    submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; status.textContent = '';
    const payload = {
      name: d.name, phone: d.phone || '', email: d.email || '', topic: d.topic, message: d.message || '',
      _subject: 'Consultation request from ' + d.name,
      _template: 'table', _captcha: 'false'
    };
    if (d.email) payload._replyto = d.email;   // reply-to only makes sense when there is an address
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 12000);
    fetch(ENDPOINT, { method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload) })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(r.status)))
      .then(j => (j && (j.success === 'true' || j.success === true)) ? succeed() : fail(d))
      .catch(() => fail(d))
      .finally(() => { clearTimeout(t); submitBtn.disabled = false; submitBtn.textContent = 'Send request'; });
  });
})();
