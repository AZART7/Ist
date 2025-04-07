const express = require('express');
const ytdl = require('ytdl-core');
const app = express();

// Allow requests from any website
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Download endpoint
app.get('/download', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).send('URL missing!');
    
    const info = await ytdl.getInfo(url);
    const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
    
    res.json({
      title: info.videoDetails.title,
      formats: formats.map(f => ({
        quality: f.qualityLabel,
        url: f.url,
        itag: f.itag
      }))
    });
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

// Start server
app.listen(3000, () => console.log('Server running on port 3000!'));
