const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { verificarToken, isAdmin, JWT_SECRET } = require('../middleware/auth');

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

if (!REFRESH_TOKEN_SECRET) {
  console.error("Erro: A variável de ambiente REFRESH_TOKEN_SECRET não está definida.");
  throw new Error("REFRESH_TOKEN_SECRET não definida");
}

let refreshTokens = [];

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Realiza login
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado
 */
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  
  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
  }
  
  try {
    const usuarios = await db.selectUsuarioPorEmail(email);
    
    if (usuarios.length === 0) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }
    
    const usuario = usuarios[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }
    
    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );
    
    refreshTokens.push(refreshToken);
    
    res.json({
      mensagem: 'Login realizado com sucesso!',
      token,
      refreshToken,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo
      }
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao realizar login.', detalhes: err.message });
  }
});

/**
 * @swagger
 * /refresh-token:
 *   post:
 *     summary: Renova token
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token renovado
 */
router.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ erro: 'Refresh token não fornecido.' });
  }
  
  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json({ erro: 'Refresh token inválido.' });
  }
  
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    
    const token = jwt.sign(
      { id: decoded.id, nome: decoded.nome, email: decoded.email, tipo: decoded.tipo },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({ token });
  } catch (error) {
    refreshTokens = refreshTokens.filter(token => token !== refreshToken);
    res.status(403).json({ erro: 'Refresh token inválido ou expirado.' });
  }
});

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Realiza logout
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       204:
 *         description: Logout realizado
 */
router.post('/logout', (req, res) => {
  const { refreshToken } = req.body;
  
  refreshTokens = refreshTokens.filter(token => token !== refreshToken);
  
  res.status(204).send();
});

/**
 * @swagger
 * /verificar-token:
 *   get:
 *     summary: Verifica token
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 */
router.get('/verificar-token', verificarToken, (req, res) => {
  res.json({ 
    valido: true, 
    usuario: req.usuario 
  });
});

module.exports = router; 