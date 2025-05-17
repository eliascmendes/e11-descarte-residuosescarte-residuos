const express = require('express');
const router = express.Router();
const db = require('../db');
const { isAuthenticated } = require('../middleware/auth');

console.log('rotas de votos carregadas');

/**
 * @swagger
 * /votos:
 *   post:
 *     summary: Cria um novo voto
 *     tags: [Votos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Voto criado com sucesso
 *       400:
 *         description: Usuário já votou nesta denúncia
 *       500:
 *         description: Erro ao registrar voto
 */
router.post('/', isAuthenticated, async (req, res) => {
  try {
    console.log('Dados do usuário:', req.usuario); // Log dos dados do usuário
    const usuario_id = req.usuario.id;
    const { denuncia_id } = req.body;
    
    console.log('Dados recebidos:', { usuario_id, denuncia_id }); // Log dos dados recebidos
    
    if (!denuncia_id) {
      console.log('Erro: ID da denúncia não fornecido');
      return res.status(400).json({ error: 'ID da denúncia é obrigatório' });
    }
    
    // Verificar se já existe um voto do mesmo usuário para esta denúncia
    const votoDuplicado = await db.checkVotoDuplicado(usuario_id, denuncia_id);
    console.log('Voto duplicado:', votoDuplicado); // Log do resultado da verificação
    
    if (votoDuplicado) {
      console.log('Erro: Usuário já votou nesta denúncia');
      return res.status(400).json({ error: 'Usuário já votou nesta denúncia' });
    }

    await db.votar(usuario_id, denuncia_id);
    console.log('Voto registrado com sucesso');
    res.status(201).json({ message: 'Voto registrado com sucesso' });
  } catch (error) {
    console.error('Erro detalhado ao registrar voto:', error);
    res.status(500).json({ error: 'Erro ao registrar voto', details: error.message });
  }
});

/**
 * @swagger
 * /votos/{id}:
 *   delete:
 *     summary: Remove um voto
 *     tags: [Votos]
 *     responses:
 *       200:
 *         description: Voto removido com sucesso
 *       500:
 *         description: Erro ao remover voto
 */
router.delete('/:id', async (req, res) => {
  try {
    const votoId = req.params.id;
    await db.deleteVoto(votoId);
    res.json({ message: 'Voto removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover voto:', error);
    res.status(500).json({ error: 'Erro ao remover voto' });
  }
});

/**
 * @swagger
 * /denuncias/{id}/votos:
 *   get:
 *     summary: Conta votos de uma denúncia
 *     tags: [Votos]
 *     responses:
 *       200:
 *         description: Total de votos da denúncia
 *       500:
 *         description: Erro ao contar votos
 */
router.get('/denuncias/:id', async (req, res) => {
  try {
    const denunciaId = req.params.id;
    
    const totalVotos = await db.countVotosPorDenuncia(denunciaId);
    res.json({ total: totalVotos });
  } catch (error) {
    console.error('Erro ao contar votos:', error);
    res.status(500).json({ error: 'Erro ao contar votos' });
  }
});

/**
 * @swagger
 * /usuarios/{id}/votos:
 *   get:
 *     summary: Lista votos de um usuário
 *     tags: [Votos]
 *     responses:
 *       200:
 *         description: Lista de votos do usuário
 *       500:
 *         description: Erro ao listar votos do usuário
 */
router.get('/usuarios/:id', async (req, res) => {
  try {
    const usuarioId = req.params.id;
    const votos = await db.getVotosPorUsuario(usuarioId);
    res.json(votos);
  } catch (error) {
    console.error('Erro ao listar votos do usuário:', error);
    res.status(500).json({ error: 'Erro ao listar votos do usuário' });
  }
});

module.exports = router;

