require('dotenv').config();
const supabase = require('../config/supabase');

async function testConnection() {
  console.log('Supabase bağlantısı test ediliyor...');
  
  const { data, error } = await supabase
    .from('tenants')
    .select('*');

  if (error) {
    console.error('❌ Bağlantı hatası:', error.message);
    return;
  }

  console.log('✅ Supabase bağlantısı başarılı!');
  console.log('📦 Mevcut tenantlar:', data);
}

testConnection();