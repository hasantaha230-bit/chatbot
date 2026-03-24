const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');

// Tüm siparişleri getir
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('orders')
      .select(`
        *,
        products (name, price),
        customers (name, phone)
      `)
      .eq('tenant_id', req.tenantId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.limit(50);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ orders: data });

  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Sipariş detayı
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        products (name, price),
        customers (name, phone)
      `)
      .eq('id', id)
      .eq('tenant_id', req.tenantId)
      .single();

    if (error) return res.status(404).json({ error: 'Sipariş bulunamadı!' });

    res.json({ order: data });

  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Sipariş durumu güncelle
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Geçersiz sipariş durumu!' });
    }

    const updateData = { status };
    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', req.tenantId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: 'Sipariş güncellendi!', order: data });

  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;