const jwt = require('jsonwebtoken');

const JWT_SECRET = require('crypto').randomBytes(64).toString('hex');

// Middleware para verificar processos de autenticação
const isAuthenticated = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
};

// Middleware para verificar permissões de administrador
const isAdmin = (req, res, next) => {
  if (req.usuario && req.usuario.tipo === 'admin') {
    next();
  } else {
    res.status(403).json({ erro: 'Acesso negado. Permissão de administrador necessária.' });
  }
};

module.exports = { isAuthenticated, isAdmin, JWT_SECRET }; 