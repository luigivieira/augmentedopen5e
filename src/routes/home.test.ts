import { describe, expect, it } from 'vitest';
import { handleHomeRequest } from './home';

describe('handleHomeRequest', () => {
  it('should return 200 with HTML content type', async () => {
    const request = new Request('http://localhost/');
    const response = handleHomeRequest(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
  });

  it('should return HTML body containing page content', async () => {
    const request = new Request('http://localhost/');
    const response = handleHomeRequest(request);
    const body = await response.text();

    expect(body).toContain('<html');
    expect(body).toContain('</html>');
  });
});
