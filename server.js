const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API endpoint to get video info
app.get('/api/download/info', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Validate YouTube URL
        if (!ytdl.validateURL(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        // Get video info
        const info = await ytdl.getInfo(url);

        // Extract relevant information
        const result = {
            title: info.videoDetails.title,
            duration: parseInt(info.videoDetails.lengthSeconds),
            formats: info.formats
                .filter(format => format.hasVideo && format.hasAudio)
                .map(format => ({
                    itag: format.itag,
                    qualityLabel: format.qualityLabel || `${format.height}p`,
                    mimeType: format.mimeType,
                    container: format.container,
                    contentLength: format.contentLength,
                    url: format.url,
                    hasAudio: format.hasAudio,
                    hasVideo: format.hasVideo
                }))
        };

        res.json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to download video
app.get('/api/download/video', async (req, res) => {
    try {
        const url = req.query.url;
        const itag = req.query.itag;

        if (!url || !itag) {
            return res.status(400).json({ error: 'URL and itag are required' });
        }

        // Validate YouTube URL
        if (!ytdl.validateURL(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        // Get video info to set proper filename
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
        const format = info.formats.find(f => f.itag === parseInt(itag));

        if (!format) {
            return res.status(400).json({ error: 'Invalid format selected' });
        }

        // Set headers for download
        res.header('Content-Disposition', `attachment; filename="${title}.${format.container}"`);
        res.header('Content-Type', 'application/octet-stream');

        // Stream the video
        ytdl(url, { quality: itag }).pipe(res);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});