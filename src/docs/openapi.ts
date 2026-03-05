export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'AugmentedOpen5e API',
    version: '1.0.0',
    description: 'API for fetching and translating D&D 5e SRD content using Edge Functions.',
  },
  servers: [
    {
      url: '/',
      description: 'Current Environment',
    },
  ],
  paths: {
    '/api/spells': {
      get: {
        summary: 'Get spells',
        description: 'Retrieve a list of D&D 5e spells with optional filters.',
        parameters: [
          {
            name: 'name',
            in: 'query',
            description: 'Exact spell name to match',
            schema: { type: 'string' },
          },
          {
            name: 'school',
            in: 'query',
            description: 'Exact school of magic to match',
            schema: { type: 'string' },
          },
          {
            name: 'slug',
            in: 'query',
            description: 'Exact spell slug to match',
            schema: { type: 'string' },
          },
          {
            name: 'level',
            in: 'query',
            description: 'Exact spell level to match',
            schema: { type: 'string' },
          },
          {
            name: 'search',
            in: 'query',
            description: 'General fuzzy text search (matches name, description, etc.)',
            schema: { type: 'string' },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results per page',
            schema: { type: 'integer', default: 50 },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination',
            schema: { type: 'integer', default: 1 },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    count: { type: 'integer' },
                    next: { type: 'string', nullable: true },
                    previous: { type: 'string', nullable: true },
                    results: {
                      type: 'array',
                      items: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
