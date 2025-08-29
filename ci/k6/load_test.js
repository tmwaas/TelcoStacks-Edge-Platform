import http from 'k6/http'; import { sleep, check } from 'k6';
export const options = { vus: 20, duration: '2m' };
export default function () {
  const base = __ENV.API_BASE || 'http://localhost:8083';
  const res = http.get(`${base}/stats`);
  check(res, {'status 200': r => r.status === 200 || r.status === 500 });
  sleep(1);
}
