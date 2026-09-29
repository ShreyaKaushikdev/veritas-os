# 📧 Leadstream - Bulk Email System for Organizers

## Complete Email Marketing & Communication Platform

---

## 🌟 Overview

**Leadstream** is a comprehensive bulk email system designed specifically for hackathon organizers to communicate effectively with participants, judges, and teams at scale.

### Key Features

✅ **Email Templates** - Beautiful, customizable templates  
✅ **Recipient Lists** - Smart list management with CSV import  
✅ **Campaigns** - Schedule and track email campaigns  
✅ **Bulk Sending** - Send to thousands with rate limiting  
✅ **Email Tracking** - Open rates, click rates, engagement metrics  
✅ **Analytics** - Comprehensive campaign performance data  
✅ **Scheduling** - Send now or schedule for later  
✅ **Template Library** - Pre-built templates for common scenarios  
✅ **Unsubscribe Management** - GDPR-compliant opt-out system  

---

## 📁 System Architecture

```
leadstream/
├── leadstream.module.ts                    # Main module
├── leadstream.controller.ts                # REST API (40+ endpoints)
├── leadstream.service.ts                   # Orchestration layer
├── services/
│   ├── email-template.service.ts          # Template management
│   ├── bulk-email.service.ts              # Mass email sending
│   ├── campaign.service.ts                # Campaign lifecycle
│   ├── email-tracking.service.ts          # Open/click tracking
│   ├── email-scheduler.service.ts         # Scheduled sending
│   └── list-management.service.ts         # Recipient lists
└── processors/
    └── email-queue.processor.ts           # Background processing
```

---

## 🚀 Quick Start

### 1. Send Your First Bulk Email

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/send-bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "eventId": "event-123",
    "subject": "Welcome to the Hackathon!",
    "htmlContent": "<h1>Hello!</h1><p>We are excited to have you join us.</p>",
    "recipients": ["participant1@example.com", "participant2@example.com"]
  }'
```

### 2. Send to All Participants

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/send-to-group \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "eventId": "event-123",
    "subject": "Important Deadline Reminder",
    "htmlContent": "<p>Submission deadline is tomorrow!</p>",
    "targetGroup": "participants"
  }'
```

---

## 📧 Email Templates

### Built-in Template Library

Leadstream includes 3 professional templates:

1. **Welcome Email** - Onboard new participants
2. **Deadline Reminder** - Time-sensitive alerts
3. **Results Announcement** - Share winner information

### Create Custom Template

```typescript
POST /api/v1/leadstream/templates

{
  "eventId": "event-123",
  "name": "Team Formation Reminder",
  "subject": "Don't forget to join a team - {{eventName}}",
  "category": "reminders",
  "htmlContent": `
    <!DOCTYPE html>
    <html>
    <body>
      <h1>Hi {{participantName}}!</h1>
      <p>We noticed you haven't joined a team yet.</p>
      <p>Deadline: {{deadline}}</p>
      <a href="{{teamUrl}}">Find a Team</a>
    </body>
    </html>
  `,
  "variables": ["participantName", "eventName", "deadline", "teamUrl"]
}
```

### Use Variables in Templates

Templates support Handlebars syntax:

```html
<p>Hello {{participantName}},</p>

{{#if isWinner}}
  <h2>Congratulations! You won {{prize}}!</h2>
{{/if}}

<ul>
{{#each teamMembers}}
  <li>{{this.name}}</li>
{{/each}}
</ul>
```

---

## 📋 Recipient Lists

### Create a List

```typescript
POST /api/v1/leadstream/lists

{
  "eventId": "event-123",
  "name": "All Participants 2024",
  "description": "Everyone registered for Spring Hack 2024",
  "filters": {
    "role": "PARTICIPANT"
  }
}
```

### Import from CSV

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/lists/list-123/import-csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@participants.csv"
```

**CSV Format:**
```csv
email,name
alice@example.com,Alice Johnson
bob@example.com,Bob Smith
```

### Add Recipients Manually

```typescript
POST /api/v1/leadstream/lists/list-123/recipients

{
  "emails": ["new1@example.com", "new2@example.com"]
}
```

### Get List Recipients (Paginated)

```bash
GET /api/v1/leadstream/lists/list-123/recipients?page=1&limit=50
```

---

## 🎯 Campaigns

### Campaign Workflow

```
1. Create Campaign
2. Preview & Test
3. Schedule or Send
4. Track Performance
5. Analyze Results
```

### Create a Campaign

```typescript
POST /api/v1/leadstream/campaigns

{
  "eventId": "event-123",
  "name": "Week 1 Update",
  "description": "Weekly progress update for all participants",
  "templateId": "template-456",
  "listId": "list-789",
  "variables": {
    "eventName": "Spring Hack 2024",
    "weekNumber": "1",
    "nextDeadline": "March 15, 2024"
  },
  "scheduledAt": "2024-03-10T09:00:00Z"  // Optional
}
```

### Send Immediately

```bash
POST /api/v1/leadstream/campaigns/campaign-123/send
```

### Schedule for Later

```bash
POST /api/v1/leadstream/campaigns/campaign-123/schedule

{
  "scheduledAt": "2024-03-15T14:00:00Z"
}
```

### Get Campaign Statistics

```bash
GET /api/v1/leadstream/campaigns/campaign-123/stats
```

**Response:**
```json
{
  "total": 500,
  "sent": 500,
  "delivered": 495,
  "opened": 320,
  "clicked": 145,
  "failed": 5,
  "openRate": 65,
  "clickRate": 29,
  "clickToOpenRate": 45
}
```

---

## 📊 Email Tracking

### How Tracking Works

1. **Open Tracking** - Invisible 1x1 pixel image
2. **Click Tracking** - URL rewriting with redirect
3. **Unsubscribe Links** - Automatic compliance

### Tracking Data Collected

- ✅ Email opened (first open time)
- ✅ Open count (multiple opens)
- ✅ Links clicked (with URLs)
- ✅ Click count (per link)
- ✅ Unsubscribe status
- ✅ Device/location (from headers)

### View Recipient Details

```bash
GET /api/v1/leadstream/analytics/campaigns/campaign-123/recipients?status=opened
```

**Statuses:**
- `queued` - In sending queue
- `sent` - Successfully sent
- `delivered` - Confirmed delivery
- `opened` - Email was opened
- `clicked` - Link was clicked
- `failed` - Send failed
- `bounced` - Email bounced
- `unsubscribed` - User unsubscribed

---

## 📈 Analytics & Reporting

### Dashboard Overview

```bash
GET /api/v1/leadstream/analytics/overview?eventId=event-123
```

**Response:**
```json
{
  "totalCampaigns": 12,
  "activeCampaigns": 2,
  "scheduledCampaigns": 3,
  "completedCampaigns": 7,
  "totalEmailsSent": 15420,
  "totalOpens": 9876,
  "totalClicks": 3421,
  "averageOpenRate": 64,
  "averageClickRate": 22
}
```

### Engagement Metrics

```bash
GET /api/v1/leadstream/analytics/engagement?eventId=event-123&days=30
```

### Export Campaign Data

```bash
GET /api/v1/leadstream/campaigns/campaign-123/stats
# Returns detailed metrics for export to CSV/Excel
```

---

## 🎯 Target Groups

Send to predefined groups without creating lists:

### Available Groups

| Group | Description | Example Use Case |
|-------|-------------|------------------|
| `all` | Everyone in the event | General announcements |
| `participants` | Only participants | Submission reminders |
| `judges` | Only judges | Judging instructions |
| `teams` | All team members | Team-specific updates |
| `custom` | Use filters | Advanced targeting |

### Send to Group

```typescript
POST /api/v1/leadstream/send-to-group

{
  "eventId": "event-123",
  "subject": "Judging Starts Tomorrow",
  "htmlContent": "<p>Get ready to evaluate projects!</p>",
  "targetGroup": "judges"
}
```

### Custom Filters

```typescript
{
  "targetGroup": "custom",
  "filters": {
    "role": "PARTICIPANT",
    "isVerified": true,
    "createdAt": {
      "gte": "2024-01-01T00:00:00Z"
    }
  }
}
```

---

## ⏰ Scheduling

### Schedule Campaign

Campaigns can be scheduled for future sending:

```typescript
{
  "scheduledAt": "2024-03-15T09:00:00Z"  // ISO 8601 format
}
```

### Automatic Scheduler

Leadstream checks every minute for scheduled campaigns and sends them automatically.

### Cancel Scheduled Campaign

```bash
POST /api/v1/leadstream/campaigns/campaign-123/cancel
```

### Recurring Campaigns

```typescript
POST /api/v1/leadstream/schedule/recurring

{
  "templateId": "template-123",
  "listId": "list-456",
  "schedule": "weekly",  // daily, weekly, monthly
  "dayOfWeek": 1,  // Monday
  "time": "09:00"
}
```

---

## 🚫 Unsubscribe & Preferences

### Automatic Unsubscribe Links

Every email automatically includes an unsubscribe link in the footer:

```html
<div style="text-align:center;...">
  <p>Don't want to receive these emails? 
     <a href="{{unsubscribeUrl}}">Unsubscribe</a>
  </p>
</div>
```

### Check if User Unsubscribed

Before sending, Leadstream automatically filters out unsubscribed users.

### Unsubscribe Page

Users click the unsubscribe link and see a confirmation page at:
```
http://your-domain.com/api/v1/leadstream/unsubscribe/{token}
```

### Email Preferences Page

Users can manage preferences at:
```
http://your-domain.com/api/v1/leadstream/preferences/{token}
```

---

## 🎨 Email Design Best Practices

### Responsive Templates

All templates should be mobile-responsive:

```html
<style>
  @media only screen and (max-width: 600px) {
    .container {
      width: 100% !important;
    }
  }
</style>
```

### Inline CSS

Use inline styles for maximum compatibility:

```html
<p style="font-family: Arial, sans-serif; color: #333333;">
  Your content here
</p>
```

### Test Before Sending

Always preview and test:

```bash
POST /api/v1/leadstream/templates/template-123/preview

{
  "variables": {
    "participantName": "Test User",
    "eventName": "Test Event"
  }
}
```

---

## 📊 Rate Limiting & Performance

### Sending Limits

- **Default Rate**: 1 email per 100ms (600/minute)
- **Burst Protection**: Random 0-1 second delay between emails
- **Queue-based**: All emails processed asynchronously

### Optimize Large Campaigns

For campaigns with 10,000+ recipients:

1. **Use Pagination**: Process in batches
2. **Schedule Off-Peak**: Send during low-traffic hours
3. **Monitor Queue**: Check Redis queue status

### Check Queue Status

```bash
redis-cli LLEN bull:email-queue:wait
redis-cli LLEN bull:email-queue:active
redis-cli LLEN bull:email-queue:completed
redis-cli LLEN bull:email-queue:failed
```

---

## 🔐 Security & Compliance

### GDPR Compliance

✅ **Consent**: Users opt-in during registration  
✅ **Unsubscribe**: One-click unsubscribe in every email  
✅ **Data Access**: Users can view their preferences  
✅ **Data Deletion**: Unsubscribe removes from future campaigns  

### CAN-SPAM Compliance

✅ **Physical Address**: Include in footer  
✅ **Unsubscribe Link**: Present in every email  
✅ **Accurate Headers**: From/Subject must match content  
✅ **Honor Opt-outs**: Process within 10 days  

### Anti-Spam Measures

- Email validation before adding to list
- Double opt-in available
- Bounce handling
- Complaint tracking

---

## 🎯 Use Cases

### 1. Welcome Series

```
Day 0: Welcome email
Day 1: Getting started guide
Day 3: Team formation reminder
Day 7: First deadline approaching
```

### 2. Deadline Reminders

```
7 days before: First reminder
3 days before: Second reminder
1 day before: Final reminder
1 hour before: Last chance
```

### 3. Results Announcement

```
Phase 1: Judging complete (all participants)
Phase 2: Winners notification (winners only)
Phase 3: Certificate delivery (all participants)
Phase 4: Survey request (all participants)
```

### 4. Engagement Campaign

```
Week 1: Tips for success
Week 2: Featured projects showcase
Week 3: Mentor spotlight
Week 4: Final preparations
```

---

## 📞 API Reference

### Templates

- `GET /api/v1/leadstream/templates` - List templates
- `POST /api/v1/leadstream/templates` - Create template
- `GET /api/v1/leadstream/templates/:id` - Get template
- `PUT /api/v1/leadstream/templates/:id` - Update template
- `DELETE /api/v1/leadstream/templates/:id` - Delete template
- `POST /api/v1/leadstream/templates/:id/preview` - Preview template

### Lists

- `GET /api/v1/leadstream/lists` - List all lists
- `POST /api/v1/leadstream/lists` - Create list
- `POST /api/v1/leadstream/lists/:id/recipients` - Add recipients
- `POST /api/v1/leadstream/lists/:id/import-csv` - Import CSV
- `GET /api/v1/leadstream/lists/:id/recipients` - Get recipients
- `DELETE /api/v1/leadstream/lists/:id` - Delete list

### Campaigns

- `GET /api/v1/leadstream/campaigns` - List campaigns
- `POST /api/v1/leadstream/campaigns` - Create campaign
- `GET /api/v1/leadstream/campaigns/:id` - Get campaign
- `POST /api/v1/leadstream/campaigns/:id/send` - Send campaign
- `POST /api/v1/leadstream/campaigns/:id/schedule` - Schedule campaign
- `POST /api/v1/leadstream/campaigns/:id/cancel` - Cancel campaign
- `GET /api/v1/leadstream/campaigns/:id/stats` - Get statistics
- `DELETE /api/v1/leadstream/campaigns/:id` - Delete campaign

### Quick Send

- `POST /api/v1/leadstream/send-bulk` - Send bulk email
- `POST /api/v1/leadstream/send-to-group` - Send to target group

### Analytics

- `GET /api/v1/leadstream/analytics/overview` - Dashboard overview
- `GET /api/v1/leadstream/analytics/engagement` - Engagement metrics
- `GET /api/v1/leadstream/analytics/campaigns/:id/recipients` - Recipient details

### Tracking

- `GET /api/v1/leadstream/tracking/opens/:id` - Track open (pixel)
- `GET /api/v1/leadstream/tracking/clicks/:id` - Track click (redirect)
- `POST /api/v1/leadstream/unsubscribe/:token` - Unsubscribe
- `GET /api/v1/leadstream/preferences/:token` - Get preferences
- `PUT /api/v1/leadstream/preferences/:token` - Update preferences

---

## 🔧 Configuration

### Environment Variables

```env
# Leadstream Configuration
LEADSTREAM_FROM_EMAIL=noreply@dogfood.os
LEADSTREAM_FROM_NAME=DOGFOOD OS Team
LEADSTREAM_REPLY_TO=support@dogfood.os

# Rate Limiting
LEADSTREAM_RATE_LIMIT=600  # Emails per minute
LEADSTREAM_BATCH_SIZE=100   # Emails per batch

# Tracking
LEADSTREAM_TRACK_OPENS=true
LEADSTREAM_TRACK_CLICKS=true

# Required for sending
SENDGRID_API_KEY=SG.your-key-here
# OR
RESEND_API_KEY=re_your-key-here
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install handlebars csv-parse
```

### 2. Configure Email Service

Add SendGrid or Resend API key to `.env`

### 3. Create Your First Template

Use the template library or create custom

### 4. Build Your Recipient List

Import CSV or add manually

### 5. Launch Campaign

Create, preview, test, and send!

---

## 💡 Pro Tips

1. **Test First**: Always send test emails to yourself
2. **Preview Variables**: Check all variables are populated
3. **Mobile-First**: Design for mobile screens
4. **Clear CTA**: One primary call-to-action per email
5. **Track Everything**: Enable open and click tracking
6. **Analyze Data**: Review metrics after each campaign
7. **A/B Testing**: Try different subject lines
8. **Timing Matters**: Send when recipients are active
9. **Personalize**: Use recipient names and data
10. **Follow Up**: Send reminder emails to non-openers

---

## 📊 Success Metrics

### Good Benchmarks

- **Open Rate**: 15-25% (industry average)
- **Click Rate**: 2-5% (industry average)
- **Bounce Rate**: <2%
- **Unsubscribe Rate**: <0.5%

### For Hackathons

- **Open Rate**: 40-60% (engaged audience)
- **Click Rate**: 10-20% (action-oriented)
- **Response Time**: <24 hours for urgent emails

---

## 🐛 Troubleshooting

### Emails Not Sending

1. Check Redis is running: `redis-cli ping`
2. Verify email API key is valid
3. Check queue status: `redis-cli LLEN bull:email-queue:failed`
4. Review error logs

### Low Open Rates

1. Check subject line (avoid spam words)
2. Verify sender email is authenticated
3. Test email on spam checkers
4. Send at optimal times

### High Bounce Rate

1. Clean recipient list
2. Verify email addresses before adding
3. Remove bounced emails automatically
4. Use double opt-in

---

## 🎉 You're Ready!

Leadstream gives you professional-grade email marketing capabilities:

✅ Beautiful templates
✅ Smart targeting  
✅ Powerful analytics
✅ GDPR compliant
✅ Production-ready

**Start sending amazing emails to your participants!** 📧

---

Built with ❤️ for DOGFOOD OS
