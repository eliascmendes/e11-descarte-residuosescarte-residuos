const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Lista usuários
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários
 */
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const usuarios = await db.selectUsuarios();
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar usuários', detalhes: err.message });
  }
});

/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Cadastra usuário
 *     tags: [Usuários]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário cadastrado
 */
router.post('/', async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }

  try {
    const usuariosExistentes = await db.selectUsuarioPorEmail(email);
    if (usuariosExistentes.length > 0) {
      return res.status(400).json({ erro: 'Este email já está em uso.' });
    }
    
    const senhaHash = await bcrypt.hash(senha, 10);
    await db.insertUsuario(nome, email, senhaHash);
    res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao cadastrar usuário.', detalhes: err.message });
  }
});

/**
 * @swagger
 * /usuarios/{id}:
 *   get:
 *     summary: Busca usuário por ID
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuário encontrado
 */
router.get('/:id', isAuthenticated, async (req, res) => {
  const id = req.params.id;
  
  if (req.usuario.tipo !== 'admin' && req.usuario.id != id) {
    return res.status(403).json({ erro: 'Acesso negado. Você não tem permissão para acessar este recurso.' });
  }
  
  try {
    const usuario = await db.getUsuarioById(id);
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar usuário.', detalhes: err.message });
  }
});

/**
 * @swagger
 * /usuarios/{id}:
 *   put:
 *     summary: Atualiza usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuário atualizado
 */
router.put('/:id', isAuthenticated, async (req, res) => {
  const id = req.params.id;
  
  if (req.usuario.tipo !== 'admin' && req.usuario.id != id) {
    return res.status(403).json({ erro: 'Acesso negado. Você não tem permissão para atualizar este usuário.' });
  }
  
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }

  try {
    const senha_hash = await bcrypt.hash(senha, 10);
    await db.updateUsuario(id, nome, email, senha_hash);
    res.json({ mensagem: 'Usuário atualizado com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar usuário.', detalhes: err.message });
  }
});

/**
 * @swagger
 * /usuarios/{id}:
 *   delete:
 *     summary: Remove usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuário removido
 */
router.delete('/:id', isAuthenticated, async (req, res) => {
  const id = req.params.id;
  
  if (req.usuario.tipo !== 'admin' && req.usuario.id != id) {
    return res.status(403).json({ erro: 'Acesso negado. Você não tem permissão para remover este usuário.' });
  }
  
  try {
    await db.deleteUsuario(id);
    res.json({ mensagem: 'Usuário removido com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao remover usuário.', detalhes: err.message });
  }
});

module.exports = router; 