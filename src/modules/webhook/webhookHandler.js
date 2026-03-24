const { processMessage } = require('../bot/stageManager');
const supabase = require('../../config/supabase');

async function handleWebhook(req, res) {
  try {
    const body = req.body;

    // Meta doğrulama
    if (body.object !== 'whatsapp_business_account') {
      return res.sendStatus(404);
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // Mesaj yoksa 200 dön
    if (!value?.messages) {
      return res.sendStatus(200);
    }

    const message = value.messages[0];
    const phoneNumberId = value.metadata?.phone_number_id;

    // Sadece text mesajları işle
    if (message.type !== 'text') {
      console.log(`⚠️ Desteklenmeyen mesaj tipi: ${message.type}`);
      return res.sendStatus(200);
    }

    const customerPhone = message.from;
    const messageText = message.text.body;

    console.log(`📩 Mesaj alındı: ${customerPhone} → ${messageText}`);

    // Tenant'ı phone_number_id ile bul
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('phone_number_id', phoneNumberId)
      .eq('is_active', true)
      .single();

    if (!tenant) {
      console.error(`❌ Tenant bulunamadı: ${phoneNumberId}`);
      return res.sendStatus(200);
    }

    // Bot yanıtı üret
    const reply = await processMessage(tenant.id, customerPhone, messageText);

    // WhatsApp'a yanıt gönder
    await sendWhatsAppMessage(customerPhone, reply, phoneNumberId, tenant.wa_token);

    return res.sendStatus(200);

  } catch (error) {
    console.error('Webhook hatası:', error.message);
    return res.sendStatus(500);
  }
}

function verifyWebhook(req, res) {
  const verifyToken = process.env.META_VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ Webhook doğrulandı!');
    return res.status(200).send(challenge);
  }

  console.error('❌ Webhook doğrulama başarısız!');
  return res.sendStatus(403);
}

async function sendWhatsAppMessage(to, message, phoneNumberId, waToken) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${waToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp gönderme hatası:', data);
      return false;
    }

    console.log(`✅ Mesaj gönderildi: ${to}`);
    return true;

  } catch (error) {
    console.error('sendWhatsAppMessage hatası:', error.message);
    return false;
  }
}

module.exports = { handleWebhook, verifyWebhook };