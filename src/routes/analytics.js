const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');

// Genel istatistikler
router.get('/summary', verifyToken, async (req, res) => {
  try {
    const tenantId = req.tenantId;

    // Toplam sipariş sayısı ve gelir
    const { data: orders } = await supabase
      .from('orders')
      .select('status, total_price')
      .eq('tenant_id', tenantId);

    // Toplam müşteri sayısı
    const { count: customerCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    // Toplam konuşma sayısı
    const { count: conversationCount } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    // Toplam ürün sayısı
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    const totalOrders = orders?.length || 0;
    const totalRevenue = orders
      ?.filter(o => o.status === 'paid')
      .reduce((sum, o) => sum + parseFloat(o.total_price), 0) || 0;

    const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;

    res.json({
      summary: {
        totalOrders,
        totalRevenue: totalRevenue.toFixed(2),
        pendingOrders,
        totalCustomers: customerCount || 0,
        totalConversations: conversationCount || 0,
        totalProducts: productCount || 0
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Son 7 günün mesaj istatistikleri
router.get('/messages', verifyToken, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('messages')
      .select('created_at, role')
      .eq('tenant_id', req.tenantId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });

    // Günlere göre grupla
    const grouped = {};
    data?.forEach(msg => {
      const date = msg.created_at.split('T')[0];
      if (!grouped[date]) grouped[date] = { date, total: 0, user: 0, assistant: 0 };
      grouped[date].total++;
      grouped[date][msg.role]++;
    });

    res.json({ messages: Object.values(grouped) });

  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// En çok satan ürünler
router.get('/top-products', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        product_id,
        quantity,
        total_price,
        products (name, price)
      `)
      .eq('tenant_id', req.tenantId)
      .eq('status', 'paid');

    if (error) return res.status(400).json({ error: error.message });

    // Ürünlere göre grupla
    const productMap = {};
    data?.forEach(order => {
      const pid = order.product_id;
      if (!productMap[pid]) {
        productMap[pid] = {
          productId: pid,
          name: order.products?.name || 'Bilinmiyor',
          totalQuantity: 0,
          totalRevenue: 0
        };
      }
      productMap[pid].totalQuantity += order.quantity;
      productMap[pid].totalRevenue += parseFloat(order.total_price);
    });

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    res.json({ topProducts });

  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;