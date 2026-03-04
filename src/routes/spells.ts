import { fetchOpen5e, Open5eApiError } from '../services/open5e';

/**
 * Handles requests to the /api/spells endpoint.
 * Abstracts Open5e's complex query parameters into a simpler, cleaner API.
 */
export async function handleSpellsRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  // Simplified query parameters mapping
  // Let's create an abstraction layer over Open5e's filtering
  const apiParams: Record<string, string | number | boolean | null | undefined> = {};

  // 1. Pagination and Limits
  if (searchParams.has('page')) apiParams.page = searchParams.get('page');
  if (searchParams.has('limit')) apiParams.limit = searchParams.get('limit');

  // 2. Exact match filters
  if (searchParams.has('name')) {
    apiParams.name__iexact = searchParams.get('name');
  }

  if (searchParams.has('school')) {
    apiParams.school__iexact = searchParams.get('school');
  }

  if (searchParams.has('slug')) {
    apiParams.slug__iexact = searchParams.get('slug');
  }

  if (searchParams.has('level')) {
    apiParams.level__iexact = searchParams.get('level');
  }

  // 3. Generic full-text search (includes name, description, etc.)
  if (searchParams.has('search')) {
    apiParams.search = searchParams.get('search');
  }

  try {
    // TODO: Implement Edge SQL Check
    // Before fetching from Open5e, we should query the local SQLite replica
    // e.g. edgeSql.query('SELECT * FROM spells WHERE ...')
    // If cache hits, decode and return immediately.

    // Fetch from Open5e
    const data = await fetchOpen5e('spells/', { params: apiParams });

    // TODO: Implement Background Translation & SQL Caching
    // If we fetched fresh data from Open5e, we should trigger a background task
    // using event.waitUntil() to translate it with Hugging Face and store it in Edge SQL.

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60', // Add a slight browser-level cache
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
    const status = error instanceof Open5eApiError ? error.status : 500;

    return new Response(JSON.stringify({ error: errorMsg }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
