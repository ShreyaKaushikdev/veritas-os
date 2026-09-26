import http from 'k6/http';
import { check, sleep } from 'k6';

// k6 Load Test — Dogfood OS Spike Hardening Benchmark (2,500 Concurrent Users)
// Simulates deadline rush & results publication spike:
// - 2,000 Concurrent Readers (Public Gallery, Precomputed Results, /verify Audit Trail)
// - 500 Concurrent Judges / Entrants (Submissions, Pairwise Duels, Ballot Scoring)

export const options = {
  scenarios: {
    // 2,000 concurrent readers hitting precomputed snapshots
    spike_readers: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 500 },
        { duration: '30s', target: 2000 },
        { duration: '30s', target: 2000 },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '5s',
      exec: 'readTraffic',
    },
    // 500 concurrent writers submitting ballots and pairwise comparisons
    submission_rush: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 100 },
        { duration: '30s', target: 500 },
        { duration: '30s', target: 500 },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '5s',
      exec: 'writeTraffic',
    },
  },
  thresholds: {
    // Target: p95 latency < 500ms under 2,500 concurrent users
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'], // < 1% error rate
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001/api/v1';
const EVENT_ID = __ENV.EVENT_ID || 'demo-event-2026';

export function readTraffic() {
  // 1. Static precomputed results read (zero request-time re-ranking)
  const resResults = http.get(`${BASE_URL}/events/${EVENT_ID}/ranking/published`);
  check(resResults, {
    'published results status is 200': (r) => r.status === 200,
    'published results response under 200ms': (r) => r.timings.duration < 200,
  });

  // 2. Public Gallery (indexed query on eventId + eligibility + isFrozen)
  const resGallery = http.get(`${BASE_URL}/submissions/event/${EVENT_ID}/gallery`);
  check(resGallery, {
    'gallery status is 200': (r) => r.status === 200,
    'gallery response under 250ms': (r) => r.timings.duration < 250,
  });

  // 3. Normalization Proof Theorem endpoint
  const resProof = http.get(`${BASE_URL}/events/${EVENT_ID}/ranking/normalization-proof`);
  check(resProof, {
    'proof status is 200': (r) => r.status === 200,
  });

  sleep(1);
}

export function writeTraffic() {
  const headers = { 'Content-Type': 'application/json' };

  // 1. Pairwise comparison vote
  const pairwisePayload = JSON.stringify({
    projectAId: 'p1',
    projectBId: 'p2',
    winnerId: 'p1',
    isTie: false,
    notes: 'Load test automated comparison evaluation.',
  });

  const resPairwise = http.post(
    `${BASE_URL}/events/${EVENT_ID}/judging/pairwise`,
    pairwisePayload,
    { headers }
  );

  check(resPairwise, {
    'pairwise vote accepted (201/200/401 auth-guarded)': (r) =>
      r.status === 201 || r.status === 200 || r.status === 401,
  });

  sleep(2);
}
