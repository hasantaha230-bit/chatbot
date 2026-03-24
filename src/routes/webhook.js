const express = require('express');
const router = express.Router();
const { handleWebhook, verifyWebhook } = require('../modules/webhook/webhookHandler');

// Meta webhook doğrulama (GET)
router.get('/', verifyWebhook);

// Gelen mesajları işle (POST)
router.post('/', handleWebhook);

module.exports = router;