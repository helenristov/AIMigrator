const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(express.json());

// Replace this with your real GitHub Pages URL after publish.
// You can temporarily allow localhost for testing too.
const allowedOrigins = [
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'https://helenristov.github.io'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed from this origin'));
    }
  }
}));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/claude', async (req, res) => {
  try {
    const { system, userMsg } = req.body;

    if (!system || !userMsg) {
      return res.status(400).json({ error: 'Missing system or userMsg' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system,
        messages: [{ role: 'user', content: userMsg }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || 'Anthropic API request failed'
      });
    }

    const text = (data.content || [])
      .map(block => block.text || '')
      .join('');

    res.json({ text });
  } catch (err) {
    res.status(500).json({
      error: err.message || 'Server error'
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
