const supabase = require('../../config/supabase');

async function createOrder(tenantId, customerId, conversationId, orderData) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        tenant_id: tenantId,
        customer_id: customerId,
        conversation_id: conversationId,
        product_id: orderData.productId,
        quantity: orderData.quantity || 1,
        total_price: orderData.totalPrice,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Sipariş oluşturma hatası:', error.message);
      return null;
    }

    return data;

  } catch (error) {
    console.error('createOrder hatası:', error.message);
    return null;
  }
}

async function getOrderById(orderId, tenantId) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      products (name, price),
      customers (name, phone)
    `)
    .eq('id', orderId)
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    console.error('Sipariş getirme hatası:', error.message);
    return null;
  }

  return data;
}

async function getOrdersByCustomer(customerId, tenantId) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      products (name, price)
    `)
    .eq('customer_id', customerId)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Müşteri siparişleri hatası:', error.message);
    return [];
  }

  return data || [];
}

async function updateOrderStatus(orderId, status, extraData = {}) {
  const updateData = { status, ...extraData };

  if (status === 'paid') {
    updateData.paid_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Sipariş güncelleme hatası:', error.message);
    return null;
  }

  return data;
}

async function getTenantOrders(tenantId, status = null) {
  let query = supabase
    .from('orders')
    .select(`
      *,
      products (name, price),
      customers (name, phone)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.limit(50);

  if (error) {
    console.error('Tenant siparişleri hatası:', error.message);
    return [];
  }

  return data || [];
}

function getStatusText(status) {
  const statusMap = {
    pending: '⏳ Beklemede',
    confirmed: '✅ Onaylandı',
    paid: '💰 Ödendi',
    shipped: '🚚 Kargoya Verildi',
    delivered: '📦 Teslim Edildi',
    cancelled: '❌ İptal Edildi'
  };
  return statusMap[status] || status;
}

module.exports = {
  createOrder,
  getOrderById,
  getOrdersByCustomer,
  updateOrderStatus,
  getTenantOrders,
  getStatusText
};