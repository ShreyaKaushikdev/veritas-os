# 🎯 Participant Automation System - Complete Integration Guide

## Overview

This comprehensive automation system provides intelligent assistance to hackathon participants throughout their journey, from idea refinement to submission.

## 🌟 Features Implemented

### 1. **AI-Powered Idea Refinement Bot** ✅
- Real-time analysis against rubric criteria
- Score band prediction (e.g., 68-78/100)
- Scope pressure gauge with warnings
- Blind-spot detection
- Top 3 actionable improvements
- Competitor comparison analysis
- Historical idea evolution tracking

### 2. **Deadline & Milestone Reminders** ✅
- Smart notification system (24hrs, 6hrs, 1hr)
- Multi-channel delivery (Email, In-App, Slack, Discord, SMS)
- Submission checklist status
- Automatic cron-based checking

### 3. **Team Collaboration Assistant** ✅
- Activity digest generation
- Member contribution tracking
- Collaboration insights
- Engagement alerts

### 4. **Automatic Project Validation** ✅
- Pre-flight submission checker
- Required fields validation
- Character limit enforcement
- Link accessibility checking
- Rubric coverage analysis

### 5. **Smart Team Formation** ✅
- Skill complementarity matching
- Timezone compatibility
- Team size optimization
- Activity level scoring

### 6. **Blind-Spot Detection** ✅
- Rubric gap analysis
- Competitive positioning
- Common mistake detection
- Language quality assessment

### 7. **Version Control & Auto-Save** ✅
- Automatic snapshot creation
- Version history tracking
- Rollback capability
- Contribution attribution

### 8. **Submission Confirmation Chain** ✅
- Cryptographic receipt generation
- PDF export with QR code
- Blockchain-style hash chain
- Tamper-proof verification

---

## 📡 API Endpoints

### Idea Refinement
```
POST   /api/v1/participant-automation/events/:eventId/analyze-idea
GET    /api/v1/participant-automation/events/:eventId/projects/:projectId/idea-history
```

### Project Validation
```
POST   /api/v1/participant-automation/projects/:projectId/validate
POST   /api/v1/participant-automation/projects/:projectId/pre-flight-check
```

### Version Control
```
GET    /api/v1/participant-automation/projects/:projectId/versions
POST   /api/v1/participant-automation/projects/:projectId/versions/snapshot
POST   /api/v1/participant-automation/projects/:projectId/versions/:versionId/restore
```

### Team Collaboration
```
GET    /api/v1/participant-automation/teams/:teamId/activity-digest?days=7
GET    /api/v1/participant-automation/teams/:teamId/collaboration-insights
```

### Team Matching
```
GET    /api/v1/participant-automation/events/:eventId/team-recommendations
POST   /api/v1/participant-automation/users/:userId/skills-profile
```

### Deadlines
```
GET    /api/v1/participant-automation/events/:eventId/deadlines
POST   /api/v1/participant-automation/users/:userId/notification-preferences
```

### Submission Receipts
```
GET    /api/v1/participant-automation/projects/:projectId/submission-receipt
GET    /api/v1/participant-automation/projects/:projectId/submission-receipt/pdf
```

### Blind Spot Detection
```
POST   /api/v1/participant-automation/projects/:projectId/blindspot-scan
```

### Dashboard
```
GET    /api/v1/participant-automation/users/:userId/dashboard
```

### Webhooks
```
POST   /api/v1/participant-automation/webhooks/slack
POST   /api/v1/participant-automation/webhooks/discord
```

---

## 🔌 Third-Party Integrations

### Required Environment Variables

Create a `.env` file in your `apps/api` directory:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dogfood"

# Redis (for Bull Queue)
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
APP_URL=http://localhost:3000
API_PORT=4000

# ==================== AI SERVICES ====================

# OpenAI (for AI-powered idea analysis)
OPENAI_API_KEY=sk-your-openai-key-here

# OR Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# ==================== EMAIL SERVICES ====================

# SendGrid (recommended for production)
SENDGRID_API_KEY=SG.your-sendgrid-key-here

# OR Resend (modern alternative)
RESEND_API_KEY=re_your-resend-key-here

# ==================== MESSAGING PLATFORMS ====================

# Slack Integration
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
# Get webhook from: https://api.slack.com/messaging/webhooks

# Discord Integration  
# Get webhook from: Server Settings > Integrations > Webhooks

# ==================== SMS SERVICES ====================

# Twilio (for urgent notifications)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# ==================== ANALYTICS ====================

# Mixpanel
MIXPANEL_TOKEN=your-mixpanel-token

# Amplitude
AMPLITUDE_API_KEY=your-amplitude-key

# ==================== FILE STORAGE ====================

# AWS S3 (for attachments, receipts)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=dogfood-uploads
AWS_REGION=us-east-1

# ==================== CALENDAR ====================

# Google Calendar API
GOOGLE_CALENDAR_API_KEY=your-google-calendar-key
```

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install

# Additional packages for automation
npm install @nestjs/bull bull @nestjs/schedule
npm install axios
npm install @aws-sdk/client-s3  # If using S3
```

### 2. Setup Redis (Required for Queue)

**Using Docker:**
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

**Or install locally:**
- Windows: Download from https://github.com/microsoftarchive/redis/releases
- Mac: `brew install redis && brew services start redis`
- Linux: `sudo apt-get install redis-server`

### 3. Database Migration

The system uses your existing Prisma schema. No additional migrations needed!

### 4. Start the API

```bash
cd apps/api
npm run dev
```

The automation endpoints will be available at `http://localhost:4000/api/v1/participant-automation/*`

---

## 📝 Integration Examples

### Example 1: Analyze Idea in Real-Time

```typescript
const response = await fetch('http://localhost:4000/api/v1/participant-automation/events/event-123/analyze-idea', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    projectId: 'proj-456',  // Optional, for tracking history
    title: 'AI-Powered Code Review Assistant',
    description: 'Our project uses machine learning to automatically review code...',
    tagline: 'Automated code quality at scale'
  })
});

const data = await response.json();
console.log(data.analysis.scoreBand);  // { min: 68, max: 78, predicted: 73 }
console.log(data.analysis.blindSpots);  // Array of blind spots
console.log(data.analysis.actionableImprovements);  // Top 3 improvements
```

### Example 2: Pre-Flight Submission Check

```typescript
const response = await fetch(`http://localhost:4000/api/v1/participant-automation/projects/${projectId}/pre-flight-check`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

const data = await response.json();

if (data.ready) {
  console.log('✅ Project ready for submission!');
} else {
  console.log('⚠️ Blockers:', data.blockers);
  console.log('💡 Recommendations:', data.recommendations);
}
```

### Example 3: Get Team Recommendations

```typescript
const response = await fetch(`http://localhost:4000/api/v1/participant-automation/events/${eventId}/team-recommendations`, {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

const data = await response.json();
data.recommendations.forEach(team => {
  console.log(`${team.teamName} - Match Score: ${team.matchScore}/100`);
  console.log(`Reasons: ${team.reasons.join(', ')}`);
});
```

---

## 🎨 Frontend Integration (React/Next.js)

### Custom Hook for Idea Analysis

```typescript
// hooks/useIdeaAnalysis.ts
import { useState } from 'react';

export function useIdeaAnalysis(eventId: string) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async (data: { title: string; description: string }) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/participant-automation/events/${eventId}/analyze-idea`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      const result = await response.json();
      setAnalysis(result.analysis);
    } finally {
      setLoading(false);
    }
  };

  return { analysis, analyze, loading };
}
```

### Real-Time Idea Feedback Component

```typescript
// components/IdeaAnalyzer.tsx
import { useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { useIdeaAnalysis } from '../hooks/useIdeaAnalysis';

export function IdeaAnalyzer({ eventId, title, description }) {
  const { analysis, analyze, loading } = useIdeaAnalysis(eventId);
  const [debouncedDescription] = useDebounce(description, 1000);

  useEffect(() => {
    if (title && debouncedDescription) {
      analyze({ title, description: debouncedDescription });
    }
  }, [title, debouncedDescription]);

  if (loading) return <div>Analyzing...</div>;
  if (!analysis) return null;

  return (
    <div className="idea-feedback">
      <div className="score-band">
        <h3>Predicted Score: {analysis.scoreBand.predicted}/100</h3>
        <p>Range: {analysis.scoreBand.min}-{analysis.scoreBand.max}</p>
      </div>

      <div className="scope-pressure">
        <h4>Scope Pressure: {analysis.scopePressure.level}</h4>
        <progress value={analysis.scopePressure.gauge} max={100} />
        {analysis.scopePressure.warning && (
          <p className="warning">{analysis.scopePressure.warning}</p>
        )}
      </div>

      <div className="improvements">
        <h4>Top Improvements:</h4>
        {analysis.actionableImprovements.map((imp, idx) => (
          <div key={idx} className="improvement">
            <strong>Priority {imp.priority}:</strong> {imp.suggestion}
            <small>{imp.impact}</small>
          </div>
        ))}
      </div>

      {analysis.blindSpots.length > 0 && (
        <div className="blindspots">
          <h4>⚠️ Blind Spots Detected:</h4>
          {analysis.blindSpots.map((spot, idx) => (
            <div key={idx} className={`blindspot severity-${spot.severity}`}>
              <strong>{spot.criterion}:</strong> {spot.gap}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🔔 Notification Preferences

Users can customize their notification preferences:

```typescript
const updatePreferences = async (userId: string) => {
  await fetch(`/api/v1/participant-automation/users/${userId}/notification-preferences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: true,
      inApp: true,
      slack: true,
      slackWebhook: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
      discord: false,
      sms: false,
    }),
  });
};
```

---

## 🧪 Testing

### Test Idea Analysis
```bash
curl -X POST http://localhost:4000/api/v1/participant-automation/events/event-1/analyze-idea \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "title": "Smart Home Energy Optimizer",
    "description": "Our project uses machine learning algorithms to optimize household energy consumption by analyzing usage patterns and automatically adjusting smart devices. We implement a real-time monitoring dashboard with predictive analytics to reduce energy costs by up to 30%."
  }'
```

### Test Project Validation
```bash
curl -X POST http://localhost:4000/api/v1/participant-automation/projects/proj-123/pre-flight-check \
  -H "Authorization: Bearer test-token"
```

---

## 📊 Monitoring & Analytics

All automation actions are tracked for analytics:

- Idea analysis requests
- Validation checks performed
- Notification delivery status
- User engagement metrics
- Team collaboration patterns

View metrics in your analytics dashboard (Mixpanel/Amplitude).

---

## 🐛 Troubleshooting

### Issue: Redis Connection Failed
**Solution:** Ensure Redis is running: `redis-cli ping` should return `PONG`

### Issue: Email notifications not sending
**Solution:** Check your email service API key and verify it's active

### Issue: AI analysis returning fallback suggestions
**Solution:** Verify your OpenAI/Anthropic API key is valid and has credits

### Issue: Queue jobs not processing
**Solution:** Check Redis connection and ensure Bull queues are registered properly

---

## 📚 Additional Resources

- **API Documentation:** `http://localhost:4000/api/docs`
- **Swagger UI:** Available after starting the API server
- **Prisma Studio:** `npx prisma studio` to view database

---

## 🎯 Next Steps

1. **Configure Environment Variables:** Add your API keys to `.env`
2. **Test Endpoints:** Use the provided curl examples
3. **Integrate Frontend:** Use the React hooks and components
4. **Customize Notifications:** Set up Slack/Discord webhooks
5. **Monitor Performance:** Enable analytics tracking

---

## 🤝 Support

For issues or questions:
- Check the troubleshooting section above
- Review API documentation at `/api/docs`
- Inspect Redis queue status: `redis-cli KEYS "bull:*"`

---

**Built with ❤️ for DOGFOOD OS**
