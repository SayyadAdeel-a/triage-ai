const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { generateText } = require('ai');
const { createGroq } = require('@ai-sdk/groq');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

app.post('/api/categorize', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    // Attempt llama3-70b-8192 first
    let result;
    try {
        result = await generateText({
            model: groq('llama3-70b-8192'),
            prompt: prompt,
            temperature: 0.2,
        });
    } catch (e) {
        console.warn("Primary model failed, falling back to 8b...", e);
        result = await generateText({
            model: groq('llama3-8b-8192'),
            prompt: prompt,
            temperature: 0.2,
        });
    }

    res.json({ text: result.text });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: 'Failed to process AI request' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Secure Proxy Server running on port ${PORT}`);
});
