import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [messages, setMessages] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, messagesRes, topProductsRes] = await Promise.all([
          analyticsService.getSummary(),
          analyticsService.getMessages(),
          analyticsService.getTopProducts(),
        ]);
        setSummary(summaryRes.data.summary);
        setMessages(messagesRes.data.messages);
        setTopProducts(topProductsRes.data.topProducts);
      } catch (err) {
        console.error('Dashboard veri hatası:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">Toplam Sipariş</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{summary?.totalOrders || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">Toplam Gelir</p>
          <p className="text-3xl font-bold text-green-600 mt-1">₺{summary?.totalRevenue || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">Toplam Müşteri</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{summary?.totalCustomers || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">Toplam Konuşma</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{summary?.totalConversations || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Mesaj Grafiği */}
        <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Son 7 Gün Mesajlar</h3>
          {messages.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={messages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400">
              Henüz mesaj yok
            </div>
          )}
        </div>

        {/* En Çok Satan Ürünler */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">En Çok Satanlar</h3>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.productId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-400">#{i + 1}</span>
                    <span className="text-sm text-gray-700">{p.name}</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">₺{p.totalRevenue}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400">
              Henüz satış yok
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;