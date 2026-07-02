import "server-only";

import nodemailer from "nodemailer";

let transporter;

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function getMailer() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: requiredEnv("SMTP_HOST"),
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: requiredEnv("SMTP_USER"),
      pass: requiredEnv("SMTP_PASSWORD"),
    },
  });

  return transporter;
}

export function getMailDefaults() {
  return {
    from: requiredEnv("MAIL_FROM"),
    notificationTo: requiredEnv("NOTIFICATION_EMAIL_TO"),
    reportTo: requiredEnv("REPORT_EMAIL_TO"),
  };
}
