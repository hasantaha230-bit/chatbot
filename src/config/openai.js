const OpenAI = require('openai');

if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OpenAI API key eksik!');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

module.exports = openai;