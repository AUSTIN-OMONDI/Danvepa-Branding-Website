/**
 * Danvepa — Contact Form Backend
 * Node.js + Express + Nodemailer + Multer
 *
 * Start: node server.js
 * Production: use PM2 → pm2 start server.js --name danvepa
 */

require('dotenv').config();

const express   = require('express');
const multer    = require('multer');
const nodemailer = require('nodemailer');
const path      = require('path');
const fs        = require('fs');
const rateLimit = require('express-rate-limit');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ------------------------------------------------------------------
   Multer — temp file storage for attachments
------------------------------------------------------------------ */
const uploadDir = path.join(__dirname, 'tmp_uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 }, // 10 MB per file, max 5 files
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|doc|docx|jpg|jpeg|png|zip/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error(`File type not allowed: ${ext}`));
  }
});

/* ------------------------------------------------------------------
   Rate limiting — max 5 enquiries per IP per hour
------------------------------------------------------------------ */
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

/* ------------------------------------------------------------------
   Email transporter (configure via .env)
------------------------------------------------------------------ */
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/* ------------------------------------------------------------------
   Serve static files
------------------------------------------------------------------ */
app.use(express.static(path.join(__dirname)));

/* ------------------------------------------------------------------
   POST /api/contact
------------------------------------------------------------------ */
app.post('/api/contact', limiter, upload.array('files', 5), async (req, res) => {
  const {
    name, email, company, phone,
    serviceType, budget, deadline,
    quantity, description
  } = req.body;

  // Basic server-side validation
  if (!name || !email || !company || !serviceType || !description) {
    return res.status(400).json({ success: false, message: 'Required fields are missing.' });
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address.' });
  }

  if (description.trim().length < 20) {
    return res.status(400).json({ success: false, message: 'Description is too short.' });
  }

  // Build email content
  const serviceLabels = {
    /* Apparels */
    'polo-tshirts':        'Polo Shirts & T-Shirts',
    'uniforms':            'Staff Uniforms & Workwear',
    'safety-wear':         'Coveralls, Hi-Vis & Safety Wear',
    'caps-hats':           'Caps, Hats & Hard Hats',
    'lanyards':            'Lanyards & ID Holders',
    /* Stationery */
    'business-cards':      'Business Cards',
    'letterheads':         'Letterheads & Stationery Sets',
    'notebooks':           'Notebooks, Diaries & Journals',
    'folders':             'Folders & Presentation Files',
    'pens':                'Pens & Desk Accessories',
    /* Outdoor Advertising */
    'banners':             'Roll-up & X-Frame Banners',
    'flex-banners':        'Flex Banners & Pop-up Displays',
    'flags':               'Teardrop Flags & Branded Flags',
    'vehicle-branding':    'Vehicle & Fleet Branding',
    'signage':             'Outdoor & Indoor Signage',
    /* Promotional Items */
    'mugs':                'Mugs, Tumblers & Flasks',
    'bags':                'Tote, Canvas & Jute Bags',
    'giveaways':           'Keyrings, Power Banks & Wristbands',
    'awards':              'Trophies, Plaques & Awards',
    'gift-sets':           'Corporate Gift Sets',
    /* Printing */
    'brochures':           'Brochures & Flyers',
    'annual-reports':      'Annual & Financial Reports',
    'tender-docs':         'Tender Document Production',
    'receipt-books':       'Invoice & Receipt Books',
    /* Design Services */
    'logo-design':         'Logo & Brand Identity Design',
    'marketing-collateral':'Marketing Collateral & Templates',
    'packaging-design':    'Packaging & Label Design',
    'pitch-deck':          'Presentation & Pitch Deck Design',
    /* Social Media */
    'social-strategy':     'Content Strategy & Calendar',
    'social-graphics':     'Branded Graphics & Reels',
    'community-management':'Community Management',
    'social-full':         'Full Social Media Package',
    /* Web & Software */
    'website':             'Corporate / Portfolio Website',
    'ecommerce':           'E-Commerce & Online Store',
    'crm':                 'CRM System & Client Portal',
    'inventory':           'Inventory & Stock Management',
    'custom-software':     'Custom Business Software',
    /* General */
    'multiple':            'Multiple Categories',
    'other':               'Other / Not Sure'
  };

  const budgetLabels = {
    'under-50k':  'Under KES 50,000',
    '50k-150k':   'KES 50,000 – 150,000',
    '150k-500k':  'KES 150,000 – 500,000',
    '500k-1m':    'KES 500,000 – 1,000,000',
    'above-1m':   'Above KES 1,000,000',
    'tbd':        'To Be Discussed'
  };

  const attachments = (req.files || []).map(file => ({
    filename: file.originalname,
    path:     file.path
  }));

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; color: #0f1419;">
      <div style="background: #03358a; padding: 28px 32px; border-radius: 8px 8px 0 0;">
        <h1 style="margin:0; font-size: 22px; color: white;">New Quote Request — Danvepa</h1>
      </div>
      <div style="background: #f7f9fc; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e0e4ed;">

        <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
          <tr><td style="padding:8px 0; font-size:13px; color:#666; width:40%; vertical-align:top;">Name</td>
              <td style="padding:8px 0; font-size:14px; font-weight:600;">${escHtml(name)}</td></tr>
          <tr><td style="padding:8px 0; font-size:13px; color:#666; vertical-align:top;">Email</td>
              <td style="padding:8px 0; font-size:14px;"><a href="mailto:${escHtml(email)}">${escHtml(email)}</a></td></tr>
          <tr><td style="padding:8px 0; font-size:13px; color:#666; vertical-align:top;">Organisation</td>
              <td style="padding:8px 0; font-size:14px; font-weight:600;">${escHtml(company)}</td></tr>
          ${phone ? `<tr><td style="padding:8px 0; font-size:13px; color:#666; vertical-align:top;">Phone</td>
              <td style="padding:8px 0; font-size:14px;">${escHtml(phone)}</td></tr>` : ''}
          <tr><td style="padding:8px 0; font-size:13px; color:#666; vertical-align:top;">Service</td>
              <td style="padding:8px 0; font-size:14px;">${serviceLabels[serviceType] || escHtml(serviceType)}</td></tr>
          ${budget ? `<tr><td style="padding:8px 0; font-size:13px; color:#666; vertical-align:top;">Budget</td>
              <td style="padding:8px 0; font-size:14px;">${budgetLabels[budget] || escHtml(budget)}</td></tr>` : ''}
          ${deadline ? `<tr><td style="padding:8px 0; font-size:13px; color:#666; vertical-align:top;">Deadline</td>
              <td style="padding:8px 0; font-size:14px;">${escHtml(deadline)}</td></tr>` : ''}
          ${quantity ? `<tr><td style="padding:8px 0; font-size:13px; color:#666; vertical-align:top;">Quantity</td>
              <td style="padding:8px 0; font-size:14px;">${escHtml(quantity)}</td></tr>` : ''}
        </table>

        <div style="background:white; border:1px solid #dde3f0; border-radius:6px; padding:20px; margin-bottom:24px;">
          <p style="font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#999; margin:0 0 8px;">Project Description</p>
          <p style="font-size:14px; line-height:1.7; white-space:pre-wrap; margin:0;">${escHtml(description)}</p>
        </div>

        ${attachments.length ? `<p style="font-size:13px; color:#666; margin-bottom:8px;">${attachments.length} file(s) attached below.</p>` : ''}

        <p style="font-size:12px; color:#aaa; margin:0; padding-top:16px; border-top:1px solid #e5e9f0;">
          Received ${new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', dateStyle: 'full', timeStyle: 'short' })}
        </p>
      </div>
    </div>
  `;

  const textBody = [
    'NEW QUOTE REQUEST — DANVEPA',
    '----------------------------',
    `Name: ${name}`,
    `Email: ${email}`,
    `Organisation: ${company}`,
    phone ? `Phone: ${phone}` : '',
    `Service: ${serviceLabels[serviceType] || serviceType}`,
    budget ? `Budget: ${budgetLabels[budget] || budget}` : '',
    deadline ? `Deadline: ${deadline}` : '',
    quantity ? `Quantity: ${quantity}` : '',
    '',
    'Project Description:',
    description,
    '',
    `Attachments: ${attachments.length}`,
    `Received: ${new Date().toISOString()}`
  ].filter(Boolean).join('\n');

  try {
    await transporter.sendMail({
      from:     `"Danvepa Website" <${process.env.SMTP_USER}>`,
      to:       process.env.NOTIFY_EMAIL || 'kinevrin@gmail.com',
      replyTo:  email,
      subject:  `[Quote Request] ${serviceLabels[serviceType] || serviceType} — ${company}`,
      text:     textBody,
      html:     htmlBody,
      attachments
    });

    // Auto-reply to the client
    await transporter.sendMail({
      from:     `"Danvepa" <${process.env.SMTP_USER}>`,
      to:       email,
      subject:  'We received your enquiry — Danvepa',
      html: `
        <div style="font-family:Arial,sans-serif; max-width:560px; color:#0f1419;">
          <div style="background:#03358a; padding:28px 32px; border-radius:8px 8px 0 0;">
            <h1 style="margin:0; font-size:20px; color:white;">Thank you, ${escHtml(name.split(' ')[0])}.</h1>
          </div>
          <div style="background:#f7f9fc; padding:32px; border-radius:0 0 8px 8px; border:1px solid #e0e4ed;">
            <p style="font-size:15px; line-height:1.7;">We have received your enquiry for <strong>${serviceLabels[serviceType] || serviceType}</strong> and will respond with a detailed quotation within <strong>one business day</strong>.</p>
            <p style="font-size:14px; line-height:1.7; color:#555;">If you have any urgent questions, reply to this email or call us directly.</p>
            <p style="font-size:14px; color:#333; margin-top:28px;">
              <strong>Danvepa</strong><br>
              Corporate Branding &amp; Print Production<br>
              Nairobi, Kenya<br>
              <a href="mailto:hello@danvepa.com" style="color:#03358a;">hello@danvepa.com</a>
            </p>
          </div>
        </div>
      `
    });

    // Clean up temp files
    attachments.forEach(att => {
      fs.unlink(att.path, () => {});
    });

    res.json({ success: true, message: 'Enquiry sent.' });

  } catch (err) {
    console.error('Mail error:', err);

    // Clean up temp files even on error
    (req.files || []).forEach(f => fs.unlink(f.path, () => {}));

    res.status(500).json({ success: false, message: 'Failed to send email. Please try again.' });
  }
});

/* ------------------------------------------------------------------
   HTML escape helper
------------------------------------------------------------------ */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ------------------------------------------------------------------
   Multer error handler
------------------------------------------------------------------ */
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});

/* ------------------------------------------------------------------
   Start
------------------------------------------------------------------ */
app.listen(PORT, () => {
  console.log(`Danvepa server running → http://localhost:${PORT}`);
});
