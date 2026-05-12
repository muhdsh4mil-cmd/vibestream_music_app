async function test() {
  try {
    const res = await fetch('https://api.cobalt.tools/');
    console.log('Cobalt status:', res.status);
    const data = await res.json();
    console.log('Cobalt info:', data);
  } catch (err) {
    console.error('Cobalt error:', err.message);
  }
}
test();
