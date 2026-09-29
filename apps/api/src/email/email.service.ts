import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendOTP(email: string, otp: string, name: string) {
    const mailOptions = {
      from: `"${process.env.APP_NAME || 'DOGFOOD OS'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your Email - OTP Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; }
            .otp-box { background-color: #fff; border: 2px solid #4CAF50; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Verification</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Thank you for registering with us. Please use the following OTP code to verify your email address:</p>
              <div class="otp-box">${otp}</div>
              <p><strong>This code will expire in 10 minutes.</strong></p>
              <p>If you didn't request this code, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'DOGFOOD OS'}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hello ${name}!\n\nThank you for registering. Your OTP code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('OTP Email sent: %s', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  async sendWelcomeEmail(email: string, name: string) {
    const mailOptions = {
      from: `"${process.env.APP_NAME || 'DOGFOOD OS'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to DOGFOOD OS!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome Aboard!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Your email has been successfully verified. Welcome to DOGFOOD OS!</p>
              <p>You can now access all features of your account.</p>
              <p>If you have any questions, feel free to reach out to our support team.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Welcome Email sent: %s', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't throw error for welcome email - it's not critical
      return { success: false };
    }
  }
}
