const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

// Kayıt ol
router.post('/register', async (req, res) => {
  try {
    const { email, password, brandName } = req.body;

    if (!email || !password || !brandName) {
      return res.status(400).json({ error: 'Email, şifre ve marka adı gerekli!' });
    }

    // Tenant oluştur
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({ brand_name: brandName })
      .select()
      .single();

    if (tenantError) {
      return res.status(400).json({ error: 'Marka oluşturulamadı!' });
    }

    // Şifreyi hashle
    const passwordHash = await bcrypt.hash(password, 10);

    // Kullanıcı oluştur
    const { data: user, error: userError } = await supabase
      .from('tenant_users')
      .insert({
        tenant_id: tenant.id,
        email,
        password_hash: passwordHash
      })
      .select()
      .single();

    if (userError) {
      return res.status(400).json({ error: 'Bu email zaten kayıtlı!' });
    }

    // JWT oluştur
    const token = jwt.sign(
      { userId: user.id, tenantId: tenant.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Kayıt başarılı!',
      token,
      tenant: { id: tenant.id, brandName: tenant.brand_name }
    });

  } catch (error) {
    console.error('Register hatası:', error.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Giriş yap
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email ve şifre gerekli!' });
    }

    // Kullanıcıyı bul
    const { data: user, error } = await supabase
      .from('tenant_users')
      .select('*, tenants(*)')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Email veya şifre hatalı!' });
    }

    // Şifreyi kontrol et
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Email veya şifre hatalı!' });
    }

    // JWT oluştur
    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Giriş başarılı!',
      token,
      tenant: {
        id: user.tenants.id,
        brandName: user.tenants.brand_name,
        plan: user.tenants.plan
      }
    });

  } catch (error) {
    console.error('Login hatası:', error.message);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;