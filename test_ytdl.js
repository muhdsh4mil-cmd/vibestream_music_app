const ytdl = require('@distube/ytdl-core');

async function test() {
  const id = 'gT5c-4y4Fm4';
  try {
    console.log('Fetching stream info for gT5c-4y4Fm4...');
    const info = await ytdl.getInfo(id);
    console.log('SUCCESS! Title:', info.videoDetails.title);
    
    // Find format
    const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly', quality: 'highestaudio' });
    console.log('Resolved audio format URL:', format.url.substring(0, 100) + '...');
  } catch (err) {
    console.error('FAILED with error:', err.message);
  }
}

test();
