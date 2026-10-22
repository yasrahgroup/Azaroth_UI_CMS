import nodemailer, { type Transporter } from 'nodemailer';
import type { ContactEnquiry, ChatbotLead } from '../types/index.js';

let transporter: Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.BREVO_SMTP_HOST;
  const port = parseInt(process.env.BREVO_SMTP_PORT || '587', 10);
  const user = process.env.BREVO_SMTP_USERNAME;
  const pass = process.env.BREVO_SMTP_PASSWORD;

  if (host && user && pass && !host.includes('example.com') && !user.includes('your-brevo')) {
    try {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      console.log(`[Email] Brevo SMTP configured successfully for host ${host}:${port}`);
    } catch (err) {
      console.warn('[Email] Failed to create Brevo SMTP transporter:', err);
    }
  }

  return transporter;
}

export async function sendEnquiryEmail(enquiry: ContactEnquiry): Promise<boolean> {
  const mailer = getTransporter();
  const toEmail = process.env.CONTACT_NOTIFICATION_EMAIL || process.env.INITIAL_ADMIN_EMAIL || 'azarothtechhive@gmail.com';
  const fromEmail = process.env.BREVO_FROM_EMAIL || 'notifications@azarothtechhive.com';
  const fromName = process.env.BREVO_FROM_NAME || 'Azaroth Tech-Hive System';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="background-color: #35123F; padding: 16px; border-radius: 6px; text-align: center;">
        <h2 style="color: #FAF7F2; margin: 0; font-size: 20px;">Azaroth Tech-Hive — New Contact Enquiry</h2>
      </div>
      <div style="padding: 20px 0; color: #171B2C; line-height: 1.6;">
        <p><strong>Sender Name:</strong> ${escapeHtml(enquiry.name)}</p>
        <p><strong>Email:</strong> <a href="mailto:${escapeHtml(enquiry.email)}">${escapeHtml(enquiry.email)}</a></p>
        <p><strong>Subject:</strong> ${escapeHtml(enquiry.subject)}</p>
        ${enquiry.productInterest ? `<p><strong>Product Interest:</strong> ${escapeHtml(enquiry.productInterest)}</p>` : ''}
        <div style="margin-top: 16px; padding: 16px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid #D5A13C;">
          <strong>Message Content:</strong><br />
          <p style="white-space: pre-wrap; margin-top: 8px;">${escapeHtml(enquiry.message)}</p>
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 24px;">Enquiry ID: ${enquiry.id} • Received: ${enquiry.createdAt}</p>
      </div>
    </div>
  `;

  if (!mailer) {
    console.log(`[Email Queue - Simulation Mode] New Enquiry received for ${toEmail}:`, {
      from: enquiry.email,
      name: enquiry.name,
      subject: enquiry.subject,
    });
    return true;
  }

  try {
    await mailer.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      replyTo: enquiry.email,
      subject: `[Azaroth Enquiry] ${enquiry.subject} — from ${enquiry.name}`,
      html,
    });
    console.log(`[Email] Brevo SMTP sent enquiry notification to ${toEmail}`);
    return true;
  } catch (err) {
    console.error('[Email] Failed to send Brevo SMTP notification:', err);
    return false;
  }
}

export async function sendLeadEmail(lead: ChatbotLead): Promise<boolean> {
  const mailer = getTransporter();
  const toEmail = process.env.CONTACT_NOTIFICATION_EMAIL || process.env.INITIAL_ADMIN_EMAIL || 'azarothtechhive@gmail.com';
  const fromEmail = process.env.BREVO_FROM_EMAIL || 'notifications@azarothtechhive.com';
  const fromName = process.env.BREVO_FROM_NAME || 'Azaroth Tech-Hive Bot';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="background-color: #35123F; padding: 16px; border-radius: 6px; text-align: center;">
        <h2 style="color: #FAF7F2; margin: 0; font-size: 20px;">Azaroth Tech-Hive — New Chatbot Solution Lead</h2>
      </div>
      <div style="padding: 20px 0; color: #171B2C; line-height: 1.6;">
        <p><strong>Prospect Name:</strong> ${escapeHtml(lead.name)}</p>
        <p><strong>Email:</strong> <a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a></p>
        ${lead.phone ? `<p><strong>Phone:</strong> ${escapeHtml(lead.phone)}</p>` : ''}
        ${lead.company ? `<p><strong>Company:</strong> ${escapeHtml(lead.company)}</p>` : ''}
        ${lead.businessType ? `<p><strong>Business Type:</strong> ${escapeHtml(lead.businessType)}</p>` : ''}
        ${lead.productInterest ? `<p><strong>Product Interest:</strong> <span style="color: #35123F; font-weight: bold;">${escapeHtml(lead.productInterest)}</span></p>` : ''}
        <div style="margin-top: 16px; padding: 16px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid #D5A13C;">
          <strong>Captured Requirements:</strong><br />
          <p style="white-space: pre-wrap; margin-top: 8px;">${escapeHtml(lead.requirements)}</p>
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 24px;">Lead ID: ${lead.id} • Captured: ${lead.createdAt}</p>
      </div>
    </div>
  `;

  if (!mailer) {
    console.log(`[Email Queue - Simulation Mode] New Chatbot Lead for ${toEmail}:`, {
      from: lead.email,
      name: lead.name,
      company: lead.company,
      product: lead.productInterest,
    });
    return true;
  }

  try {
    await mailer.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      replyTo: lead.email,
      subject: `[Azaroth Lead Capture] Solution Inquiry: ${lead.productInterest || 'General'} — ${lead.company || lead.name}`,
      html,
    });
    console.log(`[Email] Brevo SMTP sent lead notification to ${toEmail}`);
    return true;
  } catch (err) {
    console.error('[Email] Failed to send Brevo SMTP lead notification:', err);
    return false;
  }
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
