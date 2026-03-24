import React, { useState, useEffect } from 'react';
import { orderService } from '../services/api';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  pending: '⏳ Beklemede',
  confirmed: '✅ Onaylandı',
  paid: '💰 Ödendi',
  shipped: '🚚 Kargoda',
  delivered: '📦 Teslim Edildi',
  cancelled: '❌ İptal',
};

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      const res = await orderService.getAll(filter || undefined);
      setOrders(res.data.orders);
    } catch (err) {
      console.error('Sipariş hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await orderService.updateStatus(id, status);
      fetchOrders();
    } catch (err) {
      console.error('Güncelleme hatası:', err);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Siparişler</h2>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tüm Siparişler</option>
          <option value="pending">Beklemede</option>
          <option value="confirmed">Onaylandı</option>
          <option value="paid">Ödendi</option>
          <option value="shipped">Kargoda</option>
          <option value="delivered">Teslim Edildi</option>
          <option value="cancelled">İptal</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Yükleniyor...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Müşteri</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ürün</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tutar</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Durum</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tarih</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-400">
                    Henüz sipariş yok
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {o.customers?.phone || 'Bilinmiyor'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {o.products?.name || 'Bilinmiyor'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      ₺{o.total_price}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[o.status]}`}>
                        {STATUS_LABELS[o.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(o.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusUpdate(o.id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none"
                      >
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
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

export default Orders;