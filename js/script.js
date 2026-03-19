/* ==========================================================================
   DANVEPA — main.js
   ========================================================================== */

/* ---------- Marquee — clone items for seamless infinite loop ---------- */
document.querySelectorAll('.marquee-track').forEach(track => {
  // Clone all current children and append, so the track is 2× wide
  // CSS animates exactly -50% (left) / 0→-50% reversed, creating a seamless loop
  const items = Array.from(track.children);
  items.forEach(item => track.appendChild(item.cloneNode(true)));
});

/* ---------- Header scroll effect ---------- */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 80);
}, { passive: true });

/* ---------- Mobile nav toggle ---------- */
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');

navToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  navToggle.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', open);
});

// Close nav when a link is clicked
nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    navToggle.classList.remove('open');
  });
});

/* ---------- Smooth scroll ---------- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 80; // header height
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ---------- Active nav link on scroll ---------- */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav a[href^="#"]');

function setActiveLink() {
  const scrollY = window.scrollY + 120;
  let current = '';
  sections.forEach(sec => {
    if (scrollY >= sec.offsetTop) current = sec.id;
  });
  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
  });
}

window.addEventListener('scroll', setActiveLink, { passive: true });
setActiveLink();

/* ---------- Animated stat counters ---------- */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1800;
  const start = performance.now();
  const ease = t => 1 - Math.pow(1 - t, 3); // ease-out cubic

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
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
  '.service-card, .why-card, .work-item, .stat-item, .section-header, .about-content, .contact-info-card'
);

revealEls.forEach(el => {
  el.classList.add('reveal');
  // stagger children within a grid
  const siblings = el.parentElement.querySelectorAll(':scope > .reveal');
  const idx = Array.from(siblings).indexOf(el);
  if (idx > 0 && idx <= 4) el.classList.add(`reveal-delay-${idx}`);
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

/* ---------- Portfolio filter ---------- */
const filterBtns = document.querySelectorAll('.filter-btn');
const workItems = document.querySelectorAll('.work-item[data-category]');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    workItems.forEach(item => {
      const match = filter === 'all' || item.dataset.category === filter;
      item.style.display = match ? '' : 'none';
    });
  });
});

/* ---------- File upload UX ---------- */
const fileInput   = document.getElementById('brief');
const fileList    = document.getElementById('fileList');
const uploadArea  = document.getElementById('fileUploadArea');
let selectedFiles = [];

function renderFileList() {
  fileList.innerHTML = '';
  selectedFiles.forEach((file, i) => {
    const item = document.createElement('div');
    item.className = 'file-list-item';
    item.innerHTML = `
      <span>${file.name} <em style="opacity:0.5">(${(file.size / 1024).toFixed(0)} KB)</em></span>
      <button type="button" aria-label="Remove file" data-index="${i}">&times;</button>
    `;
    item.querySelector('button').addEventListener('click', () => {
      selectedFiles.splice(i, 1);
      renderFileList();
    });
    fileList.appendChild(item);
  });
}

if (fileInput) {
  fileInput.addEventListener('change', () => {
    Array.from(fileInput.files).forEach(f => {
      if (f.size <= 10 * 1024 * 1024) selectedFiles.push(f);
    });
    renderFileList();
    fileInput.value = '';
  });

  ['dragover', 'dragenter'].forEach(evt => {
    uploadArea.addEventListener(evt, e => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    uploadArea.addEventListener(evt, e => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
    });
  });

  uploadArea.addEventListener('drop', e => {
    Array.from(e.dataTransfer.files).forEach(f => {
      if (f.size <= 10 * 1024 * 1024) selectedFiles.push(f);
    });
    renderFileList();
  });
}

/* ---------- Set min date to today ---------- */
const deadlineInput = document.getElementById('deadline');
if (deadlineInput) {
  const today = new Date().toISOString().split('T')[0];
  deadlineInput.setAttribute('min', today);
}

/* ---------- Form validation ---------- */
function showError(id, msg) {
  const el = document.getElementById(id);
  const input = document.getElementById(id.replace('Error', ''));
  if (el) el.textContent = msg;
  if (input) input.classList.toggle('error', !!msg);
}

function validateForm() {
  let valid = true;

  const name = document.getElementById('name').value.trim();
  if (!name) { showError('nameError', 'Please enter your name.'); valid = false; }
  else showError('nameError', '');

  const email = document.getElementById('email').value.trim();
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) { showError('emailError', 'Please enter a valid email address.'); valid = false; }
  else showError('emailError', '');

  const company = document.getElementById('company').value.trim();
  if (!company) { showError('companyError', 'Please enter your organisation name.'); valid = false; }
  else showError('companyError', '');

  const service = document.getElementById('serviceType').value;
  if (!service) { showError('serviceError', 'Please select a service type.'); valid = false; }
  else showError('serviceError', '');

  const desc = document.getElementById('description').value.trim();
  if (desc.length < 20) { showError('descriptionError', 'Please describe your project in at least 20 characters.'); valid = false; }
  else showError('descriptionError', '');

  return valid;
}

/* ---------- Contact form submission ---------- */
const contactForm  = document.getElementById('contactForm');
const submitBtn    = document.getElementById('submitBtn');
const formNotice   = document.getElementById('formNotice');

if (contactForm) {
  contactForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!validateForm()) return;

    // Build FormData
    const data = new FormData(this);
    // Attach files manually since input is virtual
    selectedFiles.forEach(file => data.append('files', file));

    // UI loading state
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').hidden = true;
    submitBtn.querySelector('.btn-loader').hidden = false;
    formNotice.hidden = true;
    formNotice.className = 'form-notice';

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        body: data
      });

      const json = await res.json();

      if (res.ok && json.success) {
        formNotice.className = 'form-notice success';
        formNotice.textContent = '✓ Your enquiry has been sent! We will respond within one business day.';
        formNotice.hidden = false;
        contactForm.reset();
        selectedFiles = [];
        renderFileList();
      } else {
        throw new Error(json.message || 'Something went wrong.');
      }
    } catch (err) {
      formNotice.className = 'form-notice error';
      formNotice.textContent = `✗ ${err.message || 'Could not send your message. Please email us directly at hello@danvepa.com'}`;
      formNotice.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-text').hidden = false;
      submitBtn.querySelector('.btn-loader').hidden = true;
    }
  });
}
