const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');

// Tüm ürünleri getir
router.get('/', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', req.tenantId)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    res.json({ products: data });

  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Ürün ekle
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, price, category, style, description, stock, bestSeller } = req.body;

    if (!name || !price || !category || !style) {
      return res.status(400).json({ error: 'İsim, fiyat, kategori ve stil gerekli!' });
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        tenant_id: req.tenantId,
        name,
        price,
        category,
        style,
        description: description || '',
        stock: stock || 999,
        best_seller: bestSeller || false
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ message: 'Ürün eklendi!', product: data });

  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Ürün güncelle
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', req.tenantId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: 'Ürün güncellendi!', product: data });

  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Ürün sil
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('tenant_id', req.tenantId);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: 'Ürün silindi!' });

  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;