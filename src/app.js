const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const webhookRoute = require('./routes/webhook');
const authRoute = require('./routes/auth');
const productsRoute = require('./routes/products');
const ordersRoute = require('./routes/orders');
const analyticsRoute = require('./routes/analytics');
const chatRoute = require('./routes/chat');

app.use('/webhook', webhookRoute);
app.use('/auth', authRoute);
app.use('/products', productsRoute);
app.use('/orders', ordersRoute);
app.use('/analytics', analyticsRoute);
app.use('/chat', chatRoute);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'TextilBot backend çalışıyor 🚀',
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error('Hata:', err.message);
  res.status(500).json({ error: 'Sunucu hatası', detail: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ TextilBot backend ${PORT} portunda çalışıyor`);
  console.log(`🌍 http://localhost:${PORT}/health`);
});

module.exports = app;