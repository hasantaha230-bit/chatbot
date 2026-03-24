const express = require('express');
const router = express.Router();
const { processMessage } = require('../modules/bot/stageManager');

router.post('/message', async (req, res) => {
  try {
    const { message, phone, tenantId } = req.body;

    if (!message || !tenantId) {
      return res.status(400).json({ error: 'message ve tenantId gerekli!' });
    }

    const customerPhone = phone || `web_${Date.now()}`;

    const reply = await processMessage(tenantId, customerPhone, message);

    res.json({ reply });

  } catch (error) {
    console.error('Chat hatası:', error.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;