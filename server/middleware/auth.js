const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || '264f3746c9c7214b50f88325d6627c94';

// Middleware para verificar processos de autenticação
const verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar permissões de administrador
const isAdmin = (req, res, next) => {
  if (!req.usuario || req.usuario.tipo !== 'administrador') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

module.exports = { verificarToken, isAdmin, JWT_SECRET }; 