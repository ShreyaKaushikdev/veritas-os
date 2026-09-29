import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('capture authenticated screenshots for README', async ({ browser }) => {
  const outputDir = path.join(__dirname, '../docs/screenshots');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const pages = [
    {
      url: 'http://localhost:3000/',
      file: '01_overview_landing.png',
      user: null
    },
    {
      url: 'http://localhost:3000/organizer',
      file: '02_organizer_command_center.png',
      user: { id: 'org-1', name: 'Dr. Elena Rostova', email: 'elena@dogfood.os', role: 'ORGANIZER' }
    },
    {
      url: 'http://localhost:3000/participant',
      file: '03_participant_mission_control.png',
      user: { id: 'part-1', name: 'Alice Walker', email: 'alice@dogfood.os', role: 'PARTICIPANT' }
    },
    {
      url: 'http://localhost:3000/judge',
      file: '04_judge_cockpit.png',
      user: { id: 'judge-1', name: 'Judge Dr. Sarah Lin #2', email: 'sarah.lin@example.com', role: 'JUDGE' }
    },
    {
      url: 'http://localhost:3000/gallery',
      file: '05_public_gallery.png',
      user: { id: 'org-1', name: 'Dr. Elena Rostova', email: 'elena@dogfood.os', role: 'ORGANIZER' }
    },
    {
      url: 'http://localhost:3000/verify',
      file: '06_trust_ledger.png',
      user: { id: 'org-1', name: 'Dr. Elena Rostova', email: 'elena@dogfood.os', role: 'ORGANIZER' }
    }
  ];

  for (const p of pages) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    if (p.user) {
      await context.addInitScript((u) => {
        window.localStorage.setItem('dogfood_user', JSON.stringify(u));
        window.localStorage.setItem('dogfood_auth_token', 'demo-organizer-token');
      }, p.user);
    }
    const page = await context.newPage();
    await page.goto(p.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const targetPath = path.join(outputDir, p.file);
    await page.screenshot({ path: targetPath, fullPage: false });
    console.log(`Successfully captured authenticated screenshot: ${p.file}`);
    await context.close();
  }
});
