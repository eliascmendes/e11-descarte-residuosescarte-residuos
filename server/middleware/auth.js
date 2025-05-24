const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("Erro: A variável de ambiente JWT_SECRET não está definida.");
  throw new Error("JWT_SECRET não definida");
}

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