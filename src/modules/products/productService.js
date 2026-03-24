const supabase = require('../../config/supabase');

async function getProducts(tenantId, filters = {}) {
  let query = supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  if (filters.category) {
    query = query.ilike('category', `%${filters.category}%`);
  }

  if (filters.maxPrice) {
    query = query.lte('price', filters.maxPrice);
  }

  if (filters.minPrice) {
    query = query.gte('price', filters.minPrice);
  }

  if (filters.bestSeller) {
    query = query.eq('best_seller', true);
  }

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(10);

  if (error) {
    console.error('Ürün getirme hatası:', error.message);
    return [];
  }

  return data || [];
}

async function getProductById(productId, tenantId) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    console.error('Ürün detay hatası:', error.message);
    return null;
  }

  return data;
}

async function addProduct(tenantId, productData) {
  const { data, error } = await supabase
    .from('products')
    .insert({
      tenant_id: tenantId,
      name: productData.name,
      price: productData.price,
      category: productData.category,
      style: productData.style,
      description: productData.description || '',
      stock: productData.stock || 999,
      best_seller: productData.bestSeller || false
    })
    .select()
    .single();

  if (error) {
    console.error('Ürün ekleme hatası:', error.message);
    return null;
  }

  return data;
}

async function updateStock(productId, quantity) {
  const { data: product } = await supabase
    .from('products')
    .select('stock')
    .eq('id', productId)
    .single();

  if (!product) return false;

  const newStock = product.stock - quantity;

  if (newStock < 0) {
    console.warn('⚠️ Yetersiz stok!');
    return false;
  }

  const { error } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', productId);

  return !error;
}

async function formatProductMessage(products) {
  if (!products || products.length === 0) {
    return 'Üzgünüm, aradığınız kriterlere uygun ürün bulunamadı. 😔';
  }

  let message = '🛍️ *Ürünlerimiz:*\n\n';

  products.forEach((p, index) => {
    message += `${index + 1}. *${p.name}*\n`;
    message += `   💰 ${p.price}₺\n`;
    message += `   📦 Stok: ${p.stock > 0 ? 'Mevcut ✅' : 'Tükendi ❌'}\n`;
    if (p.description) message += `   📝 ${p.description}\n`;
    message += '\n';
  });

  return message;
}

module.exports = { getProducts, getProductById, addProduct, updateStock, formatProductMessage };