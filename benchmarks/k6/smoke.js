import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<300'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export default function () {
  // 1. Health check & database status
  const healthRes = http.get(`${BASE_URL}/database/status`);
  check(healthRes, {
    'db status is 200': (r) => r.status === 200,
    'db is connected': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status === 'CONNECTED' || body.collections?.projects > 0;
      } catch (e) {
        return false;
      }
    },
  });

  // 2. Public project gallery
  const galleryRes = http.get(`${BASE_URL}/projects?sort=rank`);
  check(galleryRes, {
    'gallery status is 200': (r) => r.status === 200,
    'projects count >= 10': (r) => {
      try {
        const body = JSON.parse(r.body);
        return (body.count || body.data?.length) >= 10;
      } catch (e) {
        return false;
      }
    },
  });

  // 3. Cryptographic Merkle trust ledger
  const trustRes = http.get(`${BASE_URL}/trust/ledger`);
  check(trustRes, {
    'trust ledger status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
