import { fetchOpen5e } from './services/open5e';

// TODO: Implement the main entry point logic here.
// In Azion Edge Functions, this usually takes the form of:
// addEventListener('fetch', event => { ... })
//
// This file will act as the monolith internal router, passing requests
// to specific endpoint handlers.

// Local testing block
if (typeof process !== 'undefined' && process.argv[1]?.endsWith('index.ts')) {
  console.log('Testing the real Open5e API directly from index.ts...');

  fetchOpen5e('spells/', { params: { slug: 'fireball', limit: 1 } })
    .then((data) => {
      console.log('✅ Success! API response:');
      console.log(JSON.stringify(data, null, 2));
    })
    .catch((error) => {
      console.error('❌ Error at API call:');
      console.error(error);
    });
}

export default {};
