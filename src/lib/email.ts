import nodemailer from 'nodemailer';
import type { SupabaseClient } from '@supabase/supabase-js';

interface BookingNotificationDetails {
  userName: string;
  roomName: string;
  time: string;
}

function validateEmailConfig() {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_SECURE || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Missing environment variables: EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, and/or EMAIL_PASS');
    throw new Error('Required EMAIL environment variables must be set');
  }
}

function createTransporter() {
  validateEmailConfig();

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

export async function sendEmail(to: string, subject: string, html?: string, text?: string) {
  const transporter = createTransporter();

  console.log('Sending email to: ' + to + ', subject: ' + subject);
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
export async function sendApprovalNotification(toEmail: string, bookingDetails: BookingNotificationDetails) {
  const subject = 'Booking Approved';
  console.log('Sending approval notification to: ' + toEmail + ', subject: ' + subject);
  const html = `
    <h1>Booking Approved</h1>
    <p>Dear ${bookingDetails.userName},</p>
    <p>Your booking for ${bookingDetails.roomName} at ${bookingDetails.time} has been approved.</p>
    <p>Details:</p>
    <ul>
      <li>Room: ${bookingDetails.roomName}</li>
      <li>Time: ${bookingDetails.time}</li>
      <li>User: ${bookingDetails.userName}</li>
    </ul>
  `;
  await sendEmail(toEmail, subject, html);
}

export async function sendRejectionNotification(toEmail: string, bookingDetails: BookingNotificationDetails) {
  const subject = 'Booking Rejected';
  console.log('Sending rejection notification to: ' + toEmail + ', subject: ' + subject);
  const html = `
    <h1>Booking Rejected</h1>
    <p>Dear ${bookingDetails.userName},</p>
    <p>Your booking for ${bookingDetails.roomName} at ${bookingDetails.time} has been rejected.</p>
    <p>Details:</p>
    <ul>
      <li>Room: ${bookingDetails.roomName}</li>
      <li>Time: ${bookingDetails.time}</li>
      <li>User: ${bookingDetails.userName}</li>
    </ul>
  `;
  await sendEmail(toEmail, subject, html);
}

export async function sendNewBookingNotificationToAdmin(supabase: SupabaseClient, bookingDetails: BookingNotificationDetails) {
  const { data: admins, error } = await supabase
    .from('profiles')
    .select('email')
    .eq('role', 'admin');

  if (error) {
    console.error('Error fetching admin emails:', error);
    throw error;
  }

  if (!admins || admins.length === 0) {
    console.warn('No admin users found');
    return;
  }

  const subject = 'New Booking Request';
  const html = `
    <h1>New Booking Request</h1>
    <p>A new booking has been requested.</p>
    <p>Details:</p>
    <ul>
      <li>Room: ${bookingDetails.roomName}</li>
      <li>Time: ${bookingDetails.time}</li>
      <li>User: ${bookingDetails.userName}</li>
    </ul>
  `;

  for (const admin of admins) {
    console.log('Sending new booking notification to admin: ' + admin.email + ', subject: ' + subject);
    await sendEmail(admin.email, subject, html);
  }
}