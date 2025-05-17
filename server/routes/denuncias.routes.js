const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { validateDenuncia, validateStatus } = require('../middleware/validation');
const { checkDenunciaAccess } = require('../middleware/denunciaAccess');
const db = require('../db');

/**
 * @swagger
 * tags:
 *   name: Denúncias
 *   description: Endpoints para gerenciamento de denúncias
 */

/**
 * @swagger
 * /denuncias:
 *   get:
 *     summary: Lista todas as denúncias
 *     tags: [Denúncias]
 *     responses:
 *       200:
 *         description: Lista de denúncias
 */
router.get('/', async (req, res) => {
  try {
    const denuncias = await db.selectDenuncias();
    res.json(denuncias);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar denúncias', detalhes: err.message });
  }
});

/**
 * @swagger
 * /denuncias/{id}:
 *   get:
 *     summary: Busca uma denúncia específica
 *     tags: [Denúncias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Denúncia encontrada
 */
router.get('/:id', async (req, res) => {
  try {
    const denuncia = await db.getDenunciaById(req.params.id);
    if (!denuncia) {
      return res.status(404).json({ erro: 'Denúncia não encontrada' });
    }
    res.json(denuncia);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar denúncia', detalhes: err.message });
  }
});

/**
 * @swagger
 * /denuncias:
 *   post:
 *     summary: Registra uma nova denúncia
 *     tags: [Denúncias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               descricao:
 *                 type: string
 *     responses:
 *       201:
 *         description: Denúncia registrada
 */
router.post('/', isAuthenticated, validateDenuncia, async (req, res) => {
  const { latitude, longitude, descricao, foto_url, cidade, cep, rua } = req.body;
  const usuario_id = req.usuario.id;

  try {
    console.log('Dados recebidos:', {
      usuario_id,
      latitude,
      longitude,
      descricao,
      foto_url,
      cidade,
      cep,
      rua
    });

    // Garantir que latitude e longitude sejam números
    const lat = latitude ? parseFloat(latitude) : null;
    const lng = longitude ? parseFloat(longitude) : null;

    // URL cobaia pra armazenar as fotos
    const tempFotoUrl = 'https://inova-equipe11/foto-denuncia.jpg';

    await db.insertDenuncia(
      usuario_id,
      lat,
      lng,
      descricao,
      tempFotoUrl, 
      cidade,
      cep,
      rua
    );
    
    res.status(201).json({ mensagem: 'Denúncia registrada com sucesso!' });
  } catch (err) {
    console.error('Erro ao registrar denúncia:', err);
    res.status(500).json({ 
      erro: 'Erro ao registrar denúncia.',
      detalhes: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

/**
 * @swagger
 * /denuncias/{id}:
 *   put:
 *     summary: Atualiza uma denúncia
 *     tags: [Denúncias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Denúncia atualizada
 */
router.put('/:id', isAuthenticated, checkDenunciaAccess, validateDenuncia, async (req, res) => {
  const { id } = req.params;
  const { latitude, longitude, descricao, foto_url, cidade, cep, rua } = req.body;

  try {
    await db.updateDenuncia(id, latitude, longitude, descricao, foto_url, cidade, cep, rua);
    res.json({ mensagem: 'Denúncia atualizada com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar denúncia', detalhes: err.message });
  }
});

/**
 * @swagger
 * /denuncias/{id}:
 *   delete:
 *     summary: Remove uma denúncia
 *     tags: [Denúncias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Denúncia removida
 */
router.delete('/:id', isAuthenticated, checkDenunciaAccess, async (req, res) => {
  const { id } = req.params;

  try {
    await db.deleteDenuncia(id);
    res.json({ mensagem: 'Denúncia removida com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao remover denúncia', detalhes: err.message });
  }
});

/**
 * @swagger
 * /denuncias/{id}/status:
 *   patch:
 *     summary: Atualiza o status de uma denúncia
 *     tags: [Denúncias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Status atualizado
 */
router.patch('/:id/status', isAuthenticated, isAdmin, validateStatus, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await db.updateDenunciaStatus(id, status);
    res.json({ mensagem: 'Status atualizado com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar status', detalhes: err.message });
  }
});

module.exports = router;
