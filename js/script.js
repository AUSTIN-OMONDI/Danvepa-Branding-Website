/* ==========================================================================
   DANVEPA — main.js
   ========================================================================== */

const WHATSAPP_NUMBER = '254725510494';
const CONTACT_EMAIL   = 'kinevrin@gmail.com';
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Footer year ---------- */
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- Marquees: duplicate items for a seamless loop ---------- */
$$('.lm-track').forEach(track => {
  Array.from(track.children).forEach(item => {
    const clone = item.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });
});

/* ---------- Header: shrink on scroll, hide on scroll down ---------- */
const header    = $('#header');
const actionBar = $('.action-bar');
let lastY = window.scrollY;

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const goingDown = y > lastY && y > 400;
  header.classList.toggle('scrolled', y > 30);
  if (!document.body.classList.contains('menu-open')) header.classList.toggle('hide', goingDown);
  if (actionBar) actionBar.classList.toggle('hide', goingDown && y < document.body.scrollHeight - innerHeight - 200);
  lastY = y;
}, { passive: true });

/* ---------- Mobile menu ---------- */
const menuBtn = $('#menuBtn');
const mMenu   = $('#mobileMenu');

function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  mMenu.setAttribute('aria-hidden', !open);
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) header.classList.remove('hide');
}
menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
$$('a', mMenu).forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

/* ---------- Active nav link ---------- */
const navLinks = $$('.nav > ul > li > a');
const sectionMap = { solutions: '#solutions', explore: '#solutions', about: '#about', process: '#process', work: '#work', clients: '#clients' };
const spy = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const href = sectionMap[entry.target.id];
    navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === href));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main section[id]').forEach(s => spy.observe(s));

/* ---------- Hero word rotator ---------- */
const words = $$('.rotator b');
if (words.length > 1 && !reduceMotion) {
  let i = 0;
  setInterval(() => {
    const cur = words[i];
    cur.classList.remove('is-on');
    cur.classList.add('is-out');
    setTimeout(() => cur.classList.remove('is-out'), 600);
    i = (i + 1) % words.length;
    words[i].classList.add('is-on');
  }, 2600);
}

/* ---------- Counters ---------- */
function countUp(el) {
  const target = +el.dataset.count;
  if (reduceMotion) { el.textContent = target; return; }
  const start = performance.now(), dur = 1600;
  const tick = now => {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
const counterObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { countUp(e.target); counterObs.unobserve(e.target); } });
}, { threshold: 0.6 });
$$('[data-count]').forEach(el => counterObs.observe(el));

/* ---------- Solution tabs ---------- */
const tabs    = $$('.tab');
const panels  = $$('.panel');
const glider  = $('.tab-glider');
const explore = $('#explore');

function moveGlider(tab) {
  if (!glider || !tab) return;
  glider.style.width = `${tab.offsetWidth}px`;
  glider.style.transform = `translateX(${tab.offsetLeft}px)`;
}

function activateTab(id, { scroll = false } = {}) {
  const tab = tabs.find(t => t.dataset.tab === id);
  if (!tab) return;
  tabs.forEach(t => {
    const on = t === tab;
    t.classList.toggle('is-active', on);
    t.setAttribute('aria-selected', on);
    t.tabIndex = on ? 0 : -1;
  });
  panels.forEach(p => p.classList.toggle('is-active', p.id === id));
  moveGlider(tab);
  tab.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  updateDots($(`#${id} .panel-cards`));
  if (scroll) explore.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
}

tabs.forEach((tab, idx) => {
  tab.addEventListener('click', () => activateTab(tab.dataset.tab));
  tab.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const next = tabs[(idx + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    next.focus();
    activateTab(next.dataset.tab);
  });
});
window.addEventListener('resize', () => moveGlider($('.tab.is-active')));
window.addEventListener('load', () => moveGlider($('.tab.is-active')));
moveGlider($('.tab.is-active'));

// Links to #branding / #software / #growth open the right tab
$$('[data-goto]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    activateTab(link.dataset.goto, { scroll: true });
    history.replaceState(null, '', `#${link.dataset.goto}`);
  });
});
if (['#branding', '#software', '#growth'].includes(location.hash)) {
  activateTab(location.hash.slice(1));
  setTimeout(() => explore.scrollIntoView(), 50);
}

// Panel CTA pre-selects the segment in the quote form
$$('.panel-intro [data-service]').forEach(btn => {
  btn.addEventListener('click', () => {
    const select = $('#serviceType');
    const group = $$('optgroup', select).find(g => g.label === btn.dataset.service);
    if (group && !select.value) { select.value = group.querySelector('option').value; select.classList.add('has-value'); }
  });
});

/* ---------- Swipe dots for mobile card carousels ---------- */
function updateDots(track) {
  if (!track) return;
  const dots = track.parentElement.querySelector('.swipe-dots');
  if (!dots) return;
  const cards = track.children.length;
  if (dots.children.length !== cards) dots.innerHTML = '<i></i>'.repeat(cards);
  const card = track.children[0];
  const step = card ? card.getBoundingClientRect().width + 12 : 1;
  const idx = Math.min(cards - 1, Math.round(track.scrollLeft / step));
  Array.from(dots.children).forEach((d, i) => d.classList.toggle('on', i === idx));
}
$$('.panel-cards').forEach(track => {
  updateDots(track);
  track.addEventListener('scroll', () => updateDots(track), { passive: true });
});

/* ---------- Cursor spotlight on cards ---------- */
if (window.matchMedia('(hover: hover)').matches) {
  document.addEventListener('pointermove', e => {
    const el = e.target.closest('[data-spot]');
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });
}

/* ---------- Scroll reveal ---------- */
const revealTargets = [
  '.head', '.bento > *', '.tabs', '.process-head', '.step', '.about-media', '.about-copy',
  '.work > *', '.contact-copy', '.form', '.f-top > *'
];
$$(revealTargets.join(',')).forEach(el => {
  el.setAttribute('data-reveal', '');
  const sibs = $$(':scope > [data-reveal]', el.parentElement);
  el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 5) * 0.08}s`);
});
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); } });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
$$('[data-reveal]').forEach(el => revealObs.observe(el));

/* ---------- Form ---------- */
const deadline = $('#deadline');
if (deadline) deadline.min = new Date().toISOString().split('T')[0];

$$('.field select').forEach(sel => sel.addEventListener('change', () => sel.classList.toggle('has-value', !!sel.value)));

function getValues() {
  const v = id => $(`#${id}`).value.trim();
  return {
    name: v('name'), email: v('email'), company: v('company'), phone: v('phone'),
    serviceType: v('serviceType'), budget: v('budget'), deadline: v('deadline'),
    quantity: v('quantity'), description: v('description')
  };
}

function setError(field, msg) {
  $(`#${field}Error`).textContent = msg;
  $(`#${field}`).classList.toggle('error', !!msg);
}

function validate(v) {
  const rules = [
    ['name',        !v.name,                                     'Please enter your name.'],
    ['email',       !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email), 'Please enter a valid email address.'],
    ['company',     !v.company,                                  'Please enter your organisation.'],
    ['serviceType', !v.serviceType,                              'Please choose a service.'],
    ['description', v.description.length < 20,                   'Please add a few more details (20+ characters).']
  ];
  let ok = true;
  rules.forEach(([f, bad, msg]) => { setError(f, bad ? msg : ''); if (bad) ok = false; });
  if (!ok) $('.field .error')?.focus();
  return ok;
}

const form      = $('#contactForm');
const submitBtn = $('#submitBtn');
const notice    = $('#formNotice');

function showNotice(type, html) {
  notice.className = `notice ${type}`;
  notice.innerHTML = html;
  notice.hidden = false;
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const values = getValues();
  if (!validate(values)) return;

  submitBtn.disabled = true;
  $('.btn-text', submitBtn).hidden = true;
  $('.btn-loader', submitBtn).hidden = false;
  notice.hidden = true;

  try {
    const res = await fetch('/.netlify/functions/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result.success) throw new Error(result.message || 'unavailable');
    showNotice('success', '✓ Your enquiry has been sent. We will respond within one business day.');
    form.reset();
    $$('.field select').forEach(s => s.classList.remove('has-value'));
  } catch {
    showNotice('error',
      `We couldn't send your enquiry online just now. Please use <strong>Send via WhatsApp</strong> ` +
      `or email <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.`);
  } finally {
    submitBtn.disabled = false;
    $('.btn-text', submitBtn).hidden = false;
    $('.btn-loader', submitBtn).hidden = true;
  }
});

$('#whatsappBtn').addEventListener('click', () => {
  const v = getValues();
  let msg = 'Hello Danvepa Enterprises,\n\nI would like to make an enquiry:\n\n';
  if (v.name)        msg += `*Name:* ${v.name}\n`;
  if (v.email)       msg += `*Email:* ${v.email}\n`;
  if (v.company)     msg += `*Organisation:* ${v.company}\n`;
  if (v.phone)       msg += `*Phone:* ${v.phone}\n`;
  if (v.serviceType) msg += `*Service:* ${v.serviceType}\n`;
  if (v.budget)      msg += `*Budget (KES):* ${v.budget}\n`;
  if (v.quantity)    msg += `*Scope / Quantity:* ${v.quantity}\n`;
  if (v.deadline)    msg += `*Required by:* ${v.deadline}\n`;
  if (v.description) msg += `\n*Project details:*\n${v.description}\n`;
  msg += '\nKindly advise on availability and pricing. Thank you.';
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
});
