import 'dotenv/config';
import PgBoss from 'pg-boss';
import { createDb } from '@openfsm/db';
import { handlePdfRender } from './handlers/pdf.handler.js';
import { handleEmailSend } from './handlers/email.handler.js';
import { handleSmsSend } from './handlers/sms.handler.js';
import { handleInvoiceReminder } from './handlers/reminder.handler.js';
import { handleWebhookDeliver } from './handlers/webhook.handler.js';
import { handleCalendarSync } from './handlers/calendar-sync.handler.js';

async function start() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://openfsm:openfsm@localhost:5432/openfsm';
  const db = createDb(connectionString);
  const boss = new PgBoss(connectionString);

  boss.on('error', (error) => console.error('pg-boss error:', error));
  await boss.start();
  console.log('Worker started. Listening for jobs...');

  await boss.work('pdf.render', async (job) => handlePdfRender(job.data, db));
  await boss.work('email.send', async (job) => handleEmailSend(job.data));
  await boss.work('sms.send', async (job) => handleSmsSend(job.data));
  await boss.work('invoice.reminder', async (job) => handleInvoiceReminder(job.data, db));
  await boss.work('webhook.deliver', async (job) => handleWebhookDeliver(job.data));
  await boss.work('calendar.sync', async (job) => handleCalendarSync(job.data, db));

  await boss.schedule('invoice.reminder', '0 9 * * *', {});

  const shutdown = async () => {
    console.log('Shutting down worker...');
    await boss.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => { console.error('Worker failed:', err); process.exit(1); });
