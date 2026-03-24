const supabase = require('../../config/supabase');
const openai = require('../../config/openai');
const { detectIntent, INTENTS } = require('./intentDetector');

const STAGES = {
  GREETING: 'greeting',
  DISCOVERY: 'discovery',
  PRODUCT_SHOWN: 'product_shown',
  CART: 'cart',
  ORDER_CONFIRM: 'order_confirm',
  PAYMENT: 'payment',
  COMPLETED: 'completed'
};

async function processMessage(tenantId, customerPhone, message) {
  try {
    // Müşteriyi bul veya oluştur
    let customer = await getOrCreateCustomer(tenantId, customerPhone);

    // Aktif konuşmayı bul veya oluştur
    let conversation = await getOrCreateConversation(tenantId, customer.id);

    // Mesajı kaydet
    await saveMessage(conversation.id, tenantId, 'user', message);

    // Geçmiş mesajları al
    const history = await getConversationHistory(conversation.id);

    // Intent tespit et
    const intent = await detectIntent(message, history);
    console.log(`🎯 Intent: ${intent} | Stage: ${conversation.current_stage}`);

    // Yanıt üret
    const reply = await generateReply(tenantId, customer, conversation, message, intent, history);

    // Yanıtı kaydet
    await saveMessage(conversation.id, tenantId, 'assistant', reply, intent);

    // Konuşmayı güncelle
    await updateConversation(conversation.id, intent);

    return reply;

  } catch (error) {
    console.error('processMessage hatası:', error.message);
    return 'Üzgünüm, bir hata oluştu. Lütfen tekrar dener misiniz?';
  }
}

async function getOrCreateCustomer(tenantId, phone) {
  const { data: existing } = await supabase
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('phone', phone)
    .single();

  if (existing) {
    await supabase
      .from('customers')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', existing.id);
    return existing;
  }

  const { data: newCustomer } = await supabase
    .from('customers')
    .insert({ tenant_id: tenantId, phone })
    .select()
    .single();

  return newCustomer;
}

async function getOrCreateConversation(tenantId, customerId) {
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('customer_id', customerId)
    .eq('is_active', true)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (existing) return existing;

  const { data: newConv } = await supabase
    .from('conversations')
    .insert({
      tenant_id: tenantId,
      customer_id: customerId,
      current_stage: STAGES.GREETING
    })
    .select()
    .single();

  return newConv;
}

async function getConversationHistory(conversationId) {
  const { data: messages } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(20);

  return messages || [];
}

async function saveMessage(conversationId, tenantId, role, content, intent = null) {
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    tenant_id: tenantId,
    role,
    content,
    intent
  });
}

async function updateConversation(conversationId, intent) {
  let stage = STAGES.DISCOVERY;

  if (intent === INTENTS.ORDER || intent === INTENTS.ADD_TO_CART) stage = STAGES.CART;
  if (intent === INTENTS.PAYMENT) stage = STAGES.PAYMENT;
  if (intent === INTENTS.GOODBYE) stage = STAGES.COMPLETED;

  await supabase
    .from('conversations')
    .update({
      current_stage: stage,
      last_message_at: new Date().toISOString()
    })
    .eq('id', conversationId);
}

async function generateReply(tenantId, customer, conversation, message, intent, history) {
  // Tenant bilgisini al
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();

  // Ürünleri al (product_search veya order intentinde)
  let productsContext = '';
  if ([INTENTS.PRODUCT_SEARCH, INTENTS.PRODUCT_DETAIL, INTENTS.ORDER, INTENTS.ADD_TO_CART].includes(intent)) {
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .limit(10);

    if (products && products.length > 0) {
      productsContext = '\n\nMevcut ürünler:\n' + products.map(p =>
        `- ${p.name} | ${p.price}₺ | Kategori: ${p.category} | Stok: ${p.stock}`
      ).join('\n');
    }
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Sen ${tenant.brand_name} markasının WhatsApp satış asistanısın.
Ton: ${tenant.tone}
Müşteri adı: ${customer.name || 'Değerli müşterimiz'}
Mevcut aşama: ${conversation.current_stage}
Tespit edilen niyet: ${intent}
${productsContext}

Kurallar:
- Kısa ve samimi yanıtlar ver (maksimum 3-4 cümle)
- Emoji kullan ama abartma
- Ürün önerirken fiyatı mutlaka belirt
- Sipariş almaya yönlendir
- WhatsApp formatına uygun yaz`
      },
      ...history.slice(-10),
      { role: 'user', content: message }
    ],
    max_tokens: 300,
    temperature: 0.7
  });

  return response.choices[0].message.content.trim();
}

module.exports = { processMessage, STAGES };