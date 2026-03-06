import { describe, expect, it } from 'vitest';
import { handleDocsRequest } from './docs';

describe('handleDocsRequest', () => {
  it('should return HTML scalar docs for /docs', async () => {
    const request = new Request('http://localhost/docs');
    const response = handleDocsRequest(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');

    const text = await response.text();
    expect(text).toContain('Scalar');
    expect(text).toContain('data-spec-url="/openapi.json"');
  });

  it('should return HTML scalar docs for / (root)', async () => {
    const request = new Request('http://localhost/');
    const response = handleDocsRequest(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');

    const text = await response.text();
    expect(text).toContain('Scalar');
  });

  it('should return JSON spec for /openapi.json', async () => {
    const request = new Request('http://localhost/openapi.json');
    const response = handleDocsRequest(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');

    const data = await response.json();
    expect(data.openapi).toBe('3.1.0');
    expect(data.info.title).toBe('AugmentedOpen5e API');
  });
});
