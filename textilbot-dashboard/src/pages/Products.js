import React, { useState, useEffect } from 'react';
import { productService } from '../services/api';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', price: '', category: '', style: '', description: '', stock: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await productService.getAll();
      setProducts(res.data.products);
    } catch (err) {
      console.error('Ürün hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await productService.create({
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock) || 999
      });
      setForm({ name: '', price: '', category: '', style: '', description: '', stock: '' });
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      console.error('Ürün ekleme hatası:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    try {
      await productService.delete(id);
      fetchProducts();
    } catch (err) {
      console.error('Silme hatası:', err);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Ürünler</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          {showForm ? 'İptal' : '+ Yeni Ürün'}
        </button>
      </div>

      {/* Ürün Ekleme Formu */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Yeni Ürün Ekle</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stil</label>
              <input
                type="text"
                value={form.style}
                onChange={(e) => setForm({ ...form, style: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stok</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Ürünü Kaydet
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ürün Listesi */}
      {loading ? (
        <p className="text-gray-500">Yükleniyor...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ürün</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Kategori</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Fiyat</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Stok</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-400">Henüz ürün yok</td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.description}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.category}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">₺{p.price}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.stock}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Products;