/* ==========================================================================
   DANVEPA — main.js
   ========================================================================== */

const WHATSAPP_NUMBER = '254725510494';
const CONTACT_EMAIL   = 'kinevrin@gmail.com';

/* ---------- Footer year ---------- */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- Marquee — clone items for seamless infinite loop ---------- */
document.querySelectorAll('.marquee-track, .hero-slogan-track').forEach(track => {
  // Duplicate children so the track is 2× wide; CSS animates exactly -50%
  Array.from(track.children).forEach(item => {
    const clone = item.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });
});

/* ---------- Header scroll effect ---------- */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ---------- Mobile nav toggle ---------- */
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');

function closeNav() {
  nav.classList.remove('open');
  navToggle.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
}

navToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  navToggle.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', open);
});

nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    closeNav();
    link.blur(); // collapse the desktop dropdown after choosing an item
  });
});

/* ---------- Active nav link on scroll ---------- */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav > ul > li > a[href^="#"]');
const solutionIds = ['solutions', 'branding', 'software', 'growth'];

function setActiveLink() {
  const y = window.scrollY + 140;
  let current = '';
  sections.forEach(sec => { if (y >= sec.offsetTop) current = sec.id; });
  if (current === 'stats') current = 'home';
  if (solutionIds.includes(current)) current = 'solutions';
  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
  });
}
window.addEventListener('scroll', setActiveLink, { passive: true });
setActiveLink();

/* ---------- Animated stat counters ---------- */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1600;
  const start = performance.now();
  const ease = t => 1 - Math.pow(1 - t, 3);

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(ease(progress) * target);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.stat-number').forEach(animateCounter);
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });

const statsStrip = document.querySelector('.stats-strip');
if (statsStrip) statsObserver.observe(statsStrip);

/* ---------- Scroll reveal ---------- */
const revealEls = document.querySelectorAll(
  '.section-header, .solution-card, .segment-head, .service-card, .process-step, .about-media, .about-text, .work-item, .contact-form, .contact-info-card, .mock-app'
);

revealEls.forEach(el => {
  el.classList.add('reveal');
  const siblings = el.parentElement.querySelectorAll(':scope > .reveal');
  const idx = Array.from(siblings).indexOf(el);
  if (idx > 0 && idx <= 5) el.classList.add(`reveal-delay-${idx}`);
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

/* ---------- Set min date to today ---------- */
const deadlineInput = document.getElementById('deadline');
if (deadlineInput) deadlineInput.min = new Date().toISOString().split('T')[0];

/* ---------- Form helpers ---------- */
const $ = id => document.getElementById(id);

function getFormValues() {
  return {
    name:        $('name').value.trim(),
    email:       $('email').value.trim(),
    company:     $('company').value.trim(),
    phone:       $('phone').value.trim(),
    serviceType: $('serviceType').value,
    budget:      $('budget').value,
    deadline:    $('deadline').value,
    quantity:    $('quantity').value.trim(),
    description: $('description').value.trim()
  };
}

function showError(field, msg) {
  const errEl = $(`${field}Error`);
  if (errEl) errEl.textContent = msg;
  $(field).classList.toggle('error', !!msg);
}

function validateForm(v) {
  const checks = [
    ['name',        !v.name,                                    'Please enter your name.'],
    ['email',       !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email), 'Please enter a valid email address.'],
    ['company',     !v.company,                                 'Please enter your organisation name.'],
    ['serviceType', !v.serviceType,                             'Please select a service.'],
    ['description', v.description.length < 20,                  'Please describe your project in at least 20 characters.']
  ];
  let valid = true;
  checks.forEach(([field, failed, msg]) => {
    showError(field, failed ? msg : '');
    if (failed) valid = false;
  });
  return valid;
}

/* ---------- Contact form submission ---------- */
const contactForm = $('contactForm');
const submitBtn   = $('submitBtn');
const formNotice  = $('formNotice');

function setLoading(loading) {
  submitBtn.disabled = loading;
  submitBtn.querySelector('.btn-text').hidden = loading;
  submitBtn.querySelector('.btn-loader').hidden = !loading;
}

function showNotice(type, html) {
  formNotice.className = `form-notice ${type}`;
  formNotice.innerHTML = html;
  formNotice.hidden = false;
}

if (contactForm) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    const values = getFormValues();
    if (!validateForm(values)) return;

    setLoading(true);
    formNotice.hidden = true;

    try {
      const res = await fetch('/.netlify/functions/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const result = await res.json().catch(() => ({}));

      if (!res.ok || !result.success) throw new Error(result.message || 'unavailable');

      showNotice('success', '✓ Your enquiry has been sent. We will respond within one business day.');
      contactForm.reset();
    } catch (err) {
      showNotice('error',
        `We couldn't send your enquiry online just now. Please tap <strong>Enquire on WhatsApp</strong> ` +
        `or email us at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.`);
    } finally {
      setLoading(false);
    }
  });
}

/* ---------- WhatsApp enquiry ---------- */
const whatsappBtn = $('whatsappBtn');
if (whatsappBtn) {
  whatsappBtn.addEventListener('click', () => {
    const v = getFormValues();
    const service = $('serviceType');
    const serviceLabel = service.value ? service.value : '';

    let msg = 'Hello Danvepa Enterprises,\n\nI would like to make an enquiry. Here are my details:\n\n';
    if (v.name)         msg += `*Name:* ${v.name}\n`;
    if (v.email)        msg += `*Email:* ${v.email}\n`;
    if (v.company)      msg += `*Organisation:* ${v.company}\n`;
    if (v.phone)        msg += `*Phone:* ${v.phone}\n`;
    if (serviceLabel)   msg += `*Service Required:* ${serviceLabel}\n`;
    if (v.budget)       msg += `*Budget (KES):* ${v.budget}\n`;
    if (v.quantity)     msg += `*Scope / Quantity:* ${v.quantity}\n`;
    if (v.deadline)     msg += `*Deadline:* ${v.deadline}\n`;
    if (v.description)  msg += `\n*Project Details:*\n${v.description}\n`;
    msg += '\nKindly advise on availability and pricing. Thank you.';

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });
}
