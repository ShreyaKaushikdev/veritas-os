# ⚡ Leadstream Quick Start

## Send Bulk Emails in 5 Minutes

---

## 🚀 Installation (30 seconds)

```bash
# Already installed if you have participant automation!
# Just need these additional packages:
npm install handlebars csv-parse
```

---

## ✅ What You Get

✅ **Email Templates** - 3 professional templates included  
✅ **Bulk Sending** - Send to thousands at once  
✅ **Tracking** - Open rates & click rates  
✅ **Scheduling** - Send now or later  
✅ **Analytics** - Campaign performance  
✅ **Lists** - Manage recipients easily  

---

## 📧 Method 1: Quick Send (Fastest)

Send an email to specific people RIGHT NOW:

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/send-bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ORGANIZER_TOKEN" \
  -d '{
    "eventId": "your-event-id",
    "subject": "Welcome to Spring Hack 2024!",
    "htmlContent": "<h1>Welcome!</h1><p>We are excited to have you join us for Spring Hack 2024.</p><p><a href=\"https://your-event.com/dashboard\">Go to Dashboard</a></p>",
    "recipients": [
      "participant1@example.com",
      "participant2@example.com",
      "participant3@example.com"
    ]
  }'
```

✅ **Done!** Emails are queued and sending.

---

## 👥 Method 2: Send to Groups (Easiest)

Send to ALL participants with one command:

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/send-to-group \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ORGANIZER_TOKEN" \
  -d '{
    "eventId": "your-event-id",
    "subject": "⏰ Submission Deadline Tomorrow!",
    "htmlContent": "<h2>Reminder</h2><p>Don'"'"'t forget to submit your project by tomorrow at 5 PM!</p>",
    "targetGroup": "participants"
  }'
```

**Available Groups:**
- `"all"` - Everyone
- `"participants"` - Only participants
- `"judges"` - Only judges
- `"teams"` - All team members

✅ **Done!** Sent to everyone in that group.

---

## 🎨 Method 3: Use Templates (Professional)

### Step 1: Clone a Template

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/template-library/welcome-email/clone \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "eventId": "your-event-id",
    "name": "My Welcome Email"
  }'
```

### Step 2: Create Campaign with Template

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "eventId": "your-event-id",
    "name": "Welcome Campaign",
    "templateId": "template-id-from-step-1",
    "recipients": ["email1@example.com", "email2@example.com"],
    "variables": {
      "eventName": "Spring Hack 2024",
      "participantName": "{{DYNAMIC}}",
      "eventDate": "March 15-17, 2024",
      "dashboardUrl": "https://your-event.com/dashboard"
    }
  }'
```

### Step 3: Send Campaign

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/campaigns/CAMPAIGN_ID/send \
  -H "Authorization: Bearer YOUR_TOKEN"
```

✅ **Done!** Professional email sent.

---

## 📊 Check Campaign Stats

```bash
curl http://localhost:4000/api/v1/leadstream/campaigns/CAMPAIGN_ID/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "total": 100,
  "sent": 100,
  "opened": 65,
  "clicked": 28,
  "openRate": 65,
  "clickRate": 28
}
```

---

## 📋 Import from CSV

### Step 1: Create a List

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/lists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "eventId": "your-event-id",
    "name": "All Participants 2024"
  }'
```

### Step 2: Upload CSV

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/lists/LIST_ID/import-csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@participants.csv"
```

**CSV Format:**
```csv
email,name
alice@example.com,Alice Johnson
bob@example.com,Bob Smith
carol@example.com,Carol Williams
```

### Step 3: Send to List

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "eventId": "your-event-id",
    "name": "Announcement",
    "templateId": "your-template-id",
    "listId": "LIST_ID",
    "variables": {}
  }'
```

---

## ⏰ Schedule for Later

Add `scheduledAt` to any campaign:

```bash
{
  "scheduledAt": "2024-03-15T09:00:00Z",
  ...other fields
}
```

✅ Campaign will send automatically at that time!

---

## 🎯 Real Examples

### Example 1: Welcome Email

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/send-bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "eventId": "spring-hack-2024",
    "subject": "🎉 Welcome to Spring Hack 2024!",
    "htmlContent": "<div style=\"font-family:Arial,sans-serif;\"><h1 style=\"color:#10b981;\">Welcome!</h1><p>We are thrilled to have you join Spring Hack 2024.</p><p><strong>What to do next:</strong></p><ol><li>Complete your profile</li><li>Form or join a team</li><li>Submit your project idea</li></ol><p><a href=\"https://springhack.com/dashboard\" style=\"background:#10b981;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;\">Go to Dashboard</a></p></div>",
    "recipients": ["newuser@example.com"]
  }'
```

### Example 2: Deadline Reminder

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/send-to-group \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "eventId": "spring-hack-2024",
    "subject": "⏰ Only 24 Hours Left to Submit!",
    "htmlContent": "<div style=\"background:#fef3c7;padding:20px;border-left:4px solid #f59e0b;\"><h2 style=\"color:#92400e;\">Deadline Approaching!</h2><p>You have <strong>24 hours</strong> to submit your project.</p><p>Deadline: <strong>March 17, 2024 at 5:00 PM EST</strong></p><a href=\"https://springhack.com/submit\">Submit Now</a></div>",
    "targetGroup": "participants"
  }'
```

### Example 3: Results Announcement

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/send-bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "eventId": "spring-hack-2024",
    "subject": "🏆 Spring Hack 2024 Results Are Here!",
    "htmlContent": "<div><h1>🏆 Results Announced!</h1><p>Thank you for participating in Spring Hack 2024!</p><h3>🥇 Winners:</h3><ol><li>Team Alpha - $5,000</li><li>Team Beta - $3,000</li><li>Team Gamma - $2,000</li></ol><p><a href=\"https://springhack.com/results\">View Full Leaderboard</a></p></div>",
    "recipients": ["all-participants@list.com"]
  }'
```

---

## 📊 Dashboard

View all your campaigns:

```bash
curl http://localhost:4000/api/v1/leadstream/analytics/overview?eventId=your-event-id \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Shows:**
- Total campaigns
- Emails sent
- Average open rate
- Average click rate
- Campaign performance

---

## ⚙️ Configuration

Only need to set:

```env
# .env file
SENDGRID_API_KEY=SG.your-key-here
# OR
RESEND_API_KEY=re_your-key-here

# Optional: Custom from email
LEADSTREAM_FROM_EMAIL=hello@your-domain.com
LEADSTREAM_FROM_NAME=Your Event Team
```

---

## 🎯 Common Use Cases

### 1. Send to Everyone

```javascript
{
  "targetGroup": "all"
}
```

### 2. Send Only to Participants

```javascript
{
  "targetGroup": "participants"
}
```

### 3. Send Only to Judges

```javascript
{
  "targetGroup": "judges"
}
```

### 4. Send with Custom Filter

```javascript
{
  "targetGroup": "custom",
  "filters": {
    "role": "PARTICIPANT",
    "isVerified": true
  }
}
```

### 5. Schedule for Tomorrow 9 AM

```javascript
{
  "scheduledAt": "2024-03-15T09:00:00Z"
}
```

---

## 🚨 Troubleshooting

### Emails not sending?

1. Check Redis is running:
   ```bash
   redis-cli ping  # Should return PONG
   ```

2. Check email API key is set:
   ```bash
   echo $SENDGRID_API_KEY
   ```

3. Check queue status:
   ```bash
   redis-cli LLEN bull:email-queue:wait
   ```

### Rate limited?

- Default: 600 emails/minute
- Adjust: Set `LEADSTREAM_RATE_LIMIT` in .env

---

## 📚 Full Documentation

For advanced features:
- **Complete Guide**: `LEADSTREAM_GUIDE.md`
- **API Reference**: 40+ endpoints documented
- **Templates**: Built-in library + custom creation
- **Analytics**: Deep dive into metrics

---

## 🎉 That's It!

You can now:

✅ Send bulk emails to thousands  
✅ Track opens and clicks  
✅ Schedule campaigns  
✅ Manage recipient lists  
✅ Analyze performance  

**Start sending professional emails to your hackathon participants!** 📧

---

**Questions?** Check `LEADSTREAM_GUIDE.md` for detailed documentation.

Built with ❤️ for DOGFOOD OS
