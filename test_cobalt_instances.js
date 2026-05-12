const id = 'gT5c-4y4Fm4';
const instances = [
  'https://cobalt.protorocks.ovh/',
  'https://cobalt.api.ryb.ph/',
  'https://cobalt.sh/',
  'https://co.wuk.sh/',
  'https://api.cobalt.best/',
  'https://cobalt.qis.la/',
  'https://api.cobalt.sh/'
];

async function testAll() {
  for (const url of instances) {
    try {
      console.log('Testing instance:', url);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${id}`,
          downloadMode: 'audio'
        })
      });

      console.log('Status:', res.status);
      const data = await res.json();
      console.log('Data:', JSON.stringify(data, null, 2));
      if (data && data.url) {
        console.log('--- FOUND WORKING OPEN INSTANCE! ---', url);
        return;
      }
    } catch (err) {
      console.log('Error with:', url, err.message);
    }
  }
}

testAll();
