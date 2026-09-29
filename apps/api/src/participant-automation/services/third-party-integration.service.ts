import { Injectable } from '@nestjs/common';
import axios from 'axios';

/**
 * Third-Party Integration Service
 * 
 * Integrates with external APIs for enhanced automation:
 * - OpenAI/Anthropic for AI-powered analysis
 * - SendGrid/Resend for email notifications
 * - Slack/Discord for team notifications
 * - Twilio for SMS alerts
 * - QR code generation
 * - PDF generation
 */

@Injectable()
export class ThirdPartyIntegrationService {
  // ==================== AI SERVICES ====================
  
  async getAISuggestions(data: any): Promise<any> {
    // Placeholder for AI API integration
    // You can integrate: OpenAI, Anthropic Claude, Cohere, etc.
    
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (!OPENAI_API_KEY && !ANTHROPIC_API_KEY) {
      return this.getFallbackSuggestions(data);
    }

    try {
      if (OPENAI_API_KEY) {
        return await this.getOpenAISuggestions(data, OPENAI_API_KEY);
      } else if (ANTHROPIC_API_KEY) {
        return await this.getAnthropicSuggestions(data, ANTHROPIC_API_KEY);
      }
    } catch (error) {
      console.error('AI API error:', error);
      return this.getFallbackSuggestions(data);
    }
  }

  private async getOpenAISuggestions(data: any, apiKey: string): Promise<any> {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert hackathon mentor. Provide 3 specific, actionable improvements for project ideas.',
          },
          {
            role: 'user',
            content: `Title: ${data.title}\nDescription: ${data.description}\n\nProvide 3 specific improvements.`,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const suggestions = response.data.choices[0].message.content
      .split('\n')
      .filter((line: string) => line.trim().length > 0)
      .slice(0, 3);

    return { suggestions };
  }

  private async getAnthropicSuggestions(data: any, apiKey: string): Promise<any> {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `As a hackathon mentor, provide 3 specific improvements for this project:\nTitle: ${data.title}\nDescription: ${data.description}`,
          },
        ],
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      },
    );

    const suggestions = response.data.content[0].text
      .split('\n')
      .filter((line: string) => line.trim().length > 0)
      .slice(0, 3);

    return { suggestions };
  }

  private getFallbackSuggestions(data: any): any {
    return {
      suggestions: [
        'Add quantifiable metrics to demonstrate impact (e.g., "reduces time by 40%")',
        'Include a specific technical architecture diagram or tech stack details',
        'Describe your target user persona and their specific pain points',
      ],
    };
  }

  // ==================== EMAIL SERVICES ====================

  async sendEmail(config: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }): Promise<boolean> {
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    try {
      if (SENDGRID_API_KEY) {
        return await this.sendViaSendGrid(config, SENDGRID_API_KEY);
      } else if (RESEND_API_KEY) {
        return await this.sendViaResend(config, RESEND_API_KEY);
      } else {
        console.log('[EMAIL SIMULATION]', config);
        return true; // Simulate success in development
      }
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  private async sendViaSendGrid(config: any, apiKey: string): Promise<boolean> {
    await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [{ to: [{ email: config.to }] }],
        from: { email: config.from || 'noreply@dogfood.os' },
        subject: config.subject,
        content: [{ type: 'text/html', value: config.html }],
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return true;
  }

  private async sendViaResend(config: any, apiKey: string): Promise<boolean> {
    await axios.post(
      'https://api.resend.com/emails',
      {
        from: config.from || 'DOGFOOD OS <noreply@dogfood.os>',
        to: config.to,
        subject: config.subject,
        html: config.html,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return true;
  }

  // ==================== SLACK INTEGRATION ====================

  async sendSlackNotification(webhookUrl: string, message: string): Promise<boolean> {
    try {
      await axios.post(webhookUrl, {
        text: message,
        mrkdwn: true,
      });
      return true;
    } catch (error) {
      console.error('Slack notification error:', error);
      return false;
    }
  }

  async sendSlackMessage(config: {
    channel: string;
    text: string;
    blocks?: any[];
  }): Promise<boolean> {
    const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

    if (!SLACK_BOT_TOKEN) {
      console.log('[SLACK SIMULATION]', config);
      return true;
    }

    try {
      await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel: config.channel,
          text: config.text,
          blocks: config.blocks,
        },
        {
          headers: {
            'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return true;
    } catch (error) {
      console.error('Slack message error:', error);
      return false;
    }
  }

  // ==================== DISCORD INTEGRATION ====================

  async sendDiscordNotification(webhookUrl: string, message: string): Promise<boolean> {
    try {
      await axios.post(webhookUrl, {
        content: message,
      });
      return true;
    } catch (error) {
      console.error('Discord notification error:', error);
      return false;
    }
  }

  // ==================== SMS SERVICES ====================

  async sendSMS(phone: string, message: string): Promise<boolean> {
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE) {
      console.log('[SMS SIMULATION]', { phone, message });
      return true;
    }

    try {
      await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
        new URLSearchParams({
          To: phone,
          From: TWILIO_PHONE,
          Body: message,
        }),
        {
          auth: {
            username: TWILIO_ACCOUNT_SID,
            password: TWILIO_AUTH_TOKEN,
          },
        },
      );
      return true;
    } catch (error) {
      console.error('SMS send error:', error);
      return false;
    }
  }

  // ==================== QR CODE GENERATION ====================

  async generateQRCode(data: string): Promise<string> {
    // Using QR Server API (free, no auth required)
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;
  }

  // ==================== ANALYTICS & MONITORING ====================

  async trackEvent(event: string, properties: any): Promise<void> {
    const MIXPANEL_TOKEN = process.env.MIXPANEL_TOKEN;
    const AMPLITUDE_API_KEY = process.env.AMPLITUDE_API_KEY;

    if (MIXPANEL_TOKEN) {
      await this.trackMixpanelEvent(event, properties, MIXPANEL_TOKEN);
    }

    if (AMPLITUDE_API_KEY) {
      await this.trackAmplitudeEvent(event, properties, AMPLITUDE_API_KEY);
    }

    // Fallback: console log
    console.log('[ANALYTICS]', event, properties);
  }

  private async trackMixpanelEvent(event: string, properties: any, token: string): Promise<void> {
    try {
      const data = {
        event,
        properties: {
          ...properties,
          token,
          time: Date.now(),
        },
      };

      await axios.post('https://api.mixpanel.com/track', {
        data: Buffer.from(JSON.stringify(data)).toString('base64'),
      });
    } catch (error) {
      console.error('Mixpanel tracking error:', error);
    }
  }

  private async trackAmplitudeEvent(event: string, properties: any, apiKey: string): Promise<void> {
    try {
      await axios.post(
        'https://api2.amplitude.com/2/httpapi',
        {
          api_key: apiKey,
          events: [
            {
              event_type: event,
              user_id: properties.userId || 'anonymous',
              event_properties: properties,
              time: Date.now(),
            },
          ],
        },
      );
    } catch (error) {
      console.error('Amplitude tracking error:', error);
    }
  }

  // ==================== FILE STORAGE ====================

  async uploadToS3(config: {
    bucket: string;
    key: string;
    body: Buffer;
    contentType?: string;
  }): Promise<string> {
    // AWS S3 upload placeholder
    // You'll need to install @aws-sdk/client-s3
    console.log('[S3 UPLOAD SIMULATION]', config.key);
    return `https://${config.bucket}.s3.amazonaws.com/${config.key}`;
  }

  // ==================== CALENDAR INTEGRATION ====================

  async createCalendarEvent(config: {
    summary: string;
    description: string;
    start: string;
    end: string;
    attendees: string[];
  }): Promise<any> {
    // Google Calendar API integration placeholder
    const GOOGLE_CALENDAR_API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;

    if (!GOOGLE_CALENDAR_API_KEY) {
      console.log('[CALENDAR SIMULATION]', config);
      return { eventId: 'simulated-event-id' };
    }

    // Implementation would use Google Calendar API
    return { eventId: 'todo-implement' };
  }
}
