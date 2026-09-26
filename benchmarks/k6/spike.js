import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom Metrics
const readLatency = new Trend('read_snapshot_duration');
const writeLatency = new Trend('ballot_write_duration');
const submissionLatency = new Trend('submission_burst_duration');
const rateLimitHits = new Counter('rate_limit_hits_429');
const errorRate = new Rate('system_error_rate');

export const options = {
  scenarios: {
    results_publish_surge: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '1m', target: 500 },   // Warm-up
        { duration: '2m', target: 2500 },  // Heavy judging & draft freeze
        { duration: '1m', target: 4000 },  // SPIKE: Public results reveal
        { duration: '2m', target: 4000 },  // Hold peak concurrent audience
        { duration: '1m', target: 500 },   // Recovery
        { duration: '30s', target: 0 },    // Drain
      ],
    },
  },
  thresholds: {
    'read_snapshot_duration': ['p(95)<450'], // 95% snapshot reads under 450ms
    'ballot_write_duration': ['p(95)<800'],  // 95% ballot writes under 800ms
    'system_error_rate': ['rate<0.02'],     // Max 2% error rate under peak spike
    'http_req_failed': ['rate<0.02'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export default function () {
  const rand = Math.random();

  // -------------------------------------------------------------
  // SCENARIO A: 80% Heavy Snapshot Reads (Public Gallery & Trust)
  // -------------------------------------------------------------
  if (rand < 0.80) {
    group('Snapshot Reads (80%)', function () {
      const endpoints = [
        `${BASE_URL}/projects?sort=rank`,
        `${BASE_URL}/projects/leaderboard/tracks`,
        `${BASE_URL}/dashboard/stats`,
        `${BASE_URL}/trust/ledger`,
      ];
      const target = endpoints[Math.floor(Math.random() * endpoints.length)];
      const start = Date.now();
      const res = http.get(target);
      readLatency.add(Date.now() - start);

      const pass = check(res, {
        'read status 200': (r) => r.status === 200,
      });

      if (!pass) {
        errorRate.add(1);
        if (res.status === 429) rateLimitHits.add(1);
      } else {
        errorRate.add(0);
      }
    });
  }
  // -------------------------------------------------------------
  // SCENARIO B: 15% Cryptographic Ballot Writes (Judging Rush)
  // -------------------------------------------------------------
  else if (rand < 0.95) {
    group('Cryptographic Ballot Writes (15%)', function () {
      const projNum = Math.floor(Math.random() * 40 + 1);
      const projId = `proj-${projNum < 10 ? '0' + projNum : projNum}`;
      const payload = JSON.stringify({
        projectId: projId,
        judgeId: `k6-judge-${__VU}@dogfood.test`,
        score: Number((Math.random() * 2 + 3).toFixed(2)),
        criteria: {
          technicalDepth: Math.floor(Math.random() * 3 + 7),
          novelty: Math.floor(Math.random() * 3 + 7),
          feasibility: Math.floor(Math.random() * 3 + 7),
          impact: Math.floor(Math.random() * 3 + 7),
        },
        notes: `Synthetic spike evaluation from VU ${__VU}`,
      });

      const params = { headers: { 'Content-Type': 'application/json' } };
      const start = Date.now();
      const res = http.post(`${BASE_URL}/judging/ballots`, payload, params);
      writeLatency.add(Date.now() - start);

      const pass = check(res, {
        'ballot write success (200 or 201)': (r) => r.status === 200 || r.status === 201,
      });

      if (!pass) {
        errorRate.add(1);
        if (res.status === 429) rateLimitHits.add(1);
      } else {
        errorRate.add(0);
      }
    });
  }
  // -------------------------------------------------------------
  // SCENARIO C: 5% Deadline Submission Burst (Frozen Commits)
  // -------------------------------------------------------------
  else {
    group('Submission Bursts (5%)', function () {
      const payload = JSON.stringify({
        title: `Spike Burst Project #${__VU}-${Date.now().toString().slice(-4)}`,
        tagline: 'High-throughput load test participant payload',
        track: 'Developer Infra',
        teamMembers: [`Member-${__VU}`, 'Co-Pilot AI'],
      });

      const params = { headers: { 'Content-Type': 'application/json' } };
      const start = Date.now();
      const res = http.post(`${BASE_URL}/projects`, payload, params);
      submissionLatency.add(Date.now() - start);

      const pass = check(res, {
        'submission registered': (r) => r.status === 200 || r.status === 201,
      });

      if (!pass) {
        errorRate.add(1);
      } else {
        errorRate.add(0);
      }
    });
  }

  sleep(Math.random() * 0.5 + 0.2);
}
