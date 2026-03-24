const openai = require('../../config/openai');

const INTENTS = {
  GREETING: 'greeting',
  PRODUCT_SEARCH: 'product_search',
  PRODUCT_DETAIL: 'product_detail',
  ADD_TO_CART: 'add_to_cart',
  ORDER: 'order',
  PAYMENT: 'payment',
  ORDER_STATUS: 'order_status',
  COMPLAINT: 'complaint',
  GOODBYE: 'goodbye',
  OTHER: 'other'
};

async function detectIntent(message, conversationHistory = []) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Sen bir tekstil/giyim mağazasının WhatsApp botusun.
Kullanıcının mesajını analiz et ve aşağıdaki intentlerden birini döndür:

- greeting: selamlama, merhaba, selam
- product_search: ürün arama, kategoriye göre arama, fiyat sorma
- product_detail: belirli bir ürün hakkında detay isteme
- add_to_cart: sepete ekleme, almak isteme
- order: sipariş verme, satın alma
- payment: ödeme yapma, ödeme linki isteme
- order_status: sipariş durumu sorgulama
- complaint: şikayet, sorun bildirme
- goodbye: görüşürüz, teşekkürler, hoşça kal
- other: diğer

SADECE intent adını döndür, başka hiçbir şey yazma.`
        },
        ...conversationHistory.slice(-5),
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 20,
      temperature: 0.1
    });

    const intent = response.choices[0].message.content.trim().toLowerCase();
    return Object.values(INTENTS).includes(intent) ? intent : INTENTS.OTHER;

  } catch (error) {
    console.error('Intent detection hatası:', error.message);
    return INTENTS.OTHER;
  }
}

module.exports = { detectIntent, INTENTS };