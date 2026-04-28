import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function toHtml(text = '') {
  return String(text).replace(/\n/g, '<br />');
}

function buildTrackingPixel(trackingId) {
  if (!trackingId) return '';
  const baseUrl = (process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');
  return `<img src="${baseUrl}/track/open/${trackingId}" width="1" height="1" alt="" style="display:none;" />`;
}

export async function sendEmail(to, subject, text, trackingId = null) {
  const html = `${toHtml(text)}${buildTrackingPixel(trackingId)}`;

  await transporter.sendMail({
    from: `"Resonova" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
}
