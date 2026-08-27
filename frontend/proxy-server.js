const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Прокси для изображений
app.get('/proxy-image', async (req, res) => {
  try {
    const { url } = req.query;
    
    console.log('Proxy request for URL:', url);
    
    if (!url) {
      console.log('No URL provided');
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    console.log('Making request to:', url);

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    res.set({
      'Content-Type': response.headers['content-type'] || 'image/jpeg',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    });

    res.send(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    console.error('Error details:', error.response?.status, error.response?.statusText);
    res.status(500).json({ error: 'Failed to proxy image', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
}); 