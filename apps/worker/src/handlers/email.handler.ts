import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

export async function handleEmailSend(data: { to: string; subject: string; html: string; from?: string }) {
  console.log(`Sending email to ${data.to}: ${data.subject}`);
  const result = await getTransporter().sendMail({
    from: data.from || process.env.SMTP_FROM || 'noreply@openfsm.local',
    to: data.to,
    subject: data.subject,
    html: data.html,
  });
  if (result.message) console.log('Email (dev mode):', JSON.parse(result.message));
}
