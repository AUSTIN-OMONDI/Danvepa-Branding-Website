const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, message: 'Method not allowed' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Invalid request body' }) };
  }

  const { name, email, company, phone, serviceType, budget, deadline, quantity, description } = data;

  if (!name || !email || !company || !serviceType || !description) {
    return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Please fill in all required fields.' }) };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const row = (label, value) =>
    value ? `<tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:600;background:#f5f5f5;width:160px">${label}</td><td style="padding:8px 12px;border:1px solid #ddd">${value}</td></tr>` : '';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto">
      <div style="background:#03358a;padding:24px 32px;border-radius:8px 8px 0 0">
        <h2 style="color:white;margin:0;font-size:20px">New Enquiry — Danvepa Website</h2>
        <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:14px">Received from the website contact form</p>
      </div>
      <div style="padding:24px 32px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px">
        <table style="border-collapse:collapse;width:100%;font-size:14px">
          ${row('Name', name)}
          ${row('Email', `<a href="mailto:${email}">${email}</a>`)}
          ${row('Organisation', company)}
          ${row('Phone', phone)}
          ${row('Service Required', serviceType)}
          ${row('Budget (KES)', budget)}
          ${row('Deadline', deadline)}
          ${row('Quantity', quantity)}
          ${row('Project Description', `<span style="white-space:pre-wrap">${description.replace(/</g,'&lt;')}</span>`)}
        </table>
        <p style="margin-top:24px;font-size:13px;color:#888">Reply directly to this email to respond to ${name}.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Danvepa Website" <${process.env.SMTP_USER}>`,
    to: process.env.MAIL_TO || 'kinevrin@gmail.com',
    replyTo: email,
    subject: `New Enquiry: ${serviceType} — ${company}`,
    html
  });

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
