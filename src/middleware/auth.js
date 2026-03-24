const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token gerekli!' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.userId;
    req.tenantId = decoded.tenantId;

    next();

  } catch (error) {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token!' });
  }
}

module.exports = { verifyToken };