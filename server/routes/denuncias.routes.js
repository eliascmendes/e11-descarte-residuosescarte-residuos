const express = require('express');
const router = express.Router();
const { verificarToken, isAdmin } = require('../middleware/auth');
const { validateDenuncia, validateStatus } = require('../middleware/validation');
const { checkDenunciaAccess } = require('../middleware/denunciaAccess');
const upload = require('../middleware/upload');
const db = require('../db');
const path = require('path');
const fs = require('fs');

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
 *       500:
 *         description: Erro ao buscar denúncias
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
 *     responses:
 *       200:
 *         description: Denúncia encontrada
 *       404:
 *         description: Denúncia não encontrada
 *       500:
 *         description: Erro ao buscar denúncia
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
 *     responses:
 *       201:
 *         description: Denúncia registrada com sucesso
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro ao registrar denúncia
 */
router.post('/', verificarToken, upload.single('foto'), validateDenuncia, async (req, res) => {
  try {
    const { latitude, longitude, descricao, cidade, cep, rua, bairro } = req.body;
    const usuario_id = req.usuario.id;

    // Se houver uma foto, usa a URL do Cloudinary
    let foto_url = null;
    if (req.file) {
      
      foto_url = req.file.path; // URL completa da imagem no Cloudinary
      console.log('Foto salva no Cloudinary:', foto_url);
    }

    const denuncia = await db.insertDenuncia(
      usuario_id,
      parseFloat(latitude),
      parseFloat(longitude),
      descricao,
      foto_url,
      cidade,
      cep,
      rua,
      bairro
    );

    res.status(201).json(denuncia);
  } catch (error) {
    console.error('Erro ao criar denúncia:', error);
    res.status(500).json({ error: 'Erro ao criar denúncia', details: error.message });
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
 *     responses:
 *       200:
 *         description: Denúncia atualizada com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       500:
 *         description: Erro ao atualizar denúncia
 */
router.put('/:id', verificarToken, checkDenunciaAccess, validateDenuncia, async (req, res) => {
  const { id } = req.params;
  const { latitude, longitude, descricao, foto_url, cidade, cep, rua, bairro } = req.body;

  try {
    await db.updateDenuncia(id, latitude, longitude, descricao, foto_url, cidade, cep, rua, bairro);
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
 *     responses:
 *       200:
 *         description: Denúncia removida com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       500:
 *         description: Erro ao remover denúncia
 */
router.delete('/:id', verificarToken, checkDenunciaAccess, async (req, res) => {
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
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado - Apenas administradores
 *       500:
 *         description: Erro ao atualizar status
 */
router.patch('/:id/status', verificarToken, isAdmin, validateStatus, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await db.updateDenunciaStatus(id, status);
    res.json({ mensagem: 'Status atualizado com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar status', detalhes: err.message });
  }
});

/**
 * @swagger
 * /denuncias/usuarios/{id}:
 *   get:
 *     summary: Lista denúncias de um usuário
 *     tags: [Denúncias]
 *     responses:
 *       200:
 *         description: Lista de denúncias do usuário
 *       500:
 *         description: Erro ao buscar denúncias
 */
router.get('/usuarios/:id', async (req, res) => {
  try {
    const usuarioId = req.params.id;
    const denuncias = await db.getDenunciasPorUsuario(usuarioId);
    res.json(denuncias);
  } catch (error) {
    console.error('Erro ao buscar denúncias do usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar denúncias do usuário' });
  }
});

module.exports = router;
