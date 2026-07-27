import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 25 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  const baseUrl = __ENV.TARGET_URL || 'http://localhost:8080';
  const res = http.get(`${baseUrl}/actuator/health`);
  check(res, {
    'health endpoint responded': (r) => r.status === 200,
  });
  sleep(1);
}
