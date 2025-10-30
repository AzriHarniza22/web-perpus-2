import type { SupabaseClient } from '@supabase/supabase-js';

interface BookingNotificationDetails {
  userName: string;
  roomName: string;
  time: string;
  tourGuide?: string;
  meetingPoint?: string;
  participantCount?: number;
}

// SMTP email service using nodemailer

// Fallback to nodemailer for Node.js runtime (server-side only)
function createTransporter() {
  // Dynamic import to avoid Edge Runtime issues
  const nodemailer = require('nodemailer');

  if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_SECURE || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Missing environment variables: EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, and/or EMAIL_PASS');
    throw new Error('Required EMAIL environment variables must be set');
  }

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
  console.log('Sending email to: ' + to + ', subject: ' + subject);

  // Use SMTP directly with nodemailer (Node.js runtime only)
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully via SMTP');
  } catch (error) {
    console.error('SMTP email send failed:', error);
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
  try {
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

    const subject = bookingDetails.tourGuide ? 'New Tour Booking Request' : 'New Booking Request';
    const html = `
      <h1>${subject}</h1>
      <p>A new ${bookingDetails.tourGuide ? 'tour ' : ''}booking has been requested.</p>
      <p>Details:</p>
      <ul>
        <li>Room: ${bookingDetails.roomName}</li>
        <li>Time: ${bookingDetails.time}</li>
        <li>User: ${bookingDetails.userName}</li>
        ${bookingDetails.tourGuide ? `<li>Tour Guide: ${bookingDetails.tourGuide}</li>` : ''}
        ${bookingDetails.meetingPoint ? `<li>Meeting Point: ${bookingDetails.meetingPoint}</li>` : ''}
        ${bookingDetails.participantCount ? `<li>Participants: ${bookingDetails.participantCount}</li>` : ''}
      </ul>
    `;

    // Send emails asynchronously to avoid blocking
    const emailPromises = admins.map(admin => {
      console.log('Sending new booking notification to admin: ' + admin.email + ', subject: ' + subject);
      return sendEmail(admin.email, subject, html).catch(emailError => {
        console.error(`Failed to send email to ${admin.email}:`, emailError);
        // Don't throw - continue with other emails
      });
    });

    await Promise.allSettled(emailPromises);
    console.log('Admin notification emails sent (async)');
  } catch (error) {
    console.error('Error in sendNewBookingNotificationToAdmin:', error);
    // Don't throw - email failures shouldn't break booking creation
  }
}