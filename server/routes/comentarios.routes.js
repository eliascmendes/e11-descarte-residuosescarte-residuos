const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken } = require('../middleware/auth');

// Listar comentários de uma denúncia
router.get('/denuncias/:id', async (req, res) => {
    try {
        const denuncia_id = req.params.id;
        const comentarios = await db.getComentariosPorDenuncia(denuncia_id);
        res.json(comentarios);
    } catch (error) {
        console.error('Erro ao buscar comentários:', error);
        res.status(500).json({ erro: 'Erro ao buscar comentários' });
    }
});

// Add comentario (requer autenticação)
router.post('/', verificarToken, async (req, res) => {
    try {
        const { denuncia_id, texto } = req.body;
        const usuario_id = req.usuario.id;

        // Validar dados
        if (!denuncia_id || !texto) {
            return res.status(400).json({ erro: 'Dados incompletos. Informe denuncia_id e texto.' });
        }

        // Verificar se a denúncia existe
        const denuncia = await db.getDenunciaById(denuncia_id);
        if (!denuncia) {
            return res.status(404).json({ erro: 'Denúncia não encontrada' });
        }

        // Adicionar comentário
        await db.comentar(usuario_id, denuncia_id, texto);
        res.status(201).json({ mensagem: 'Comentário adicionado com sucesso' });
    } catch (error) {
        console.error('Erro ao adicionar comentário:', error);
        res.status(500).json({ erro: 'Erro ao adicionar comentário' });
    }
});

// Excluir comentário (requer autenticação)
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const comentario_id = req.params.id;
        const usuario_id = req.usuario.id;

        // Excluir comentário
        const sucesso = await db.deleteComentario(comentario_id, usuario_id);
        
        if (sucesso) {
            res.json({ mensagem: 'Comentário excluído com sucesso' });
        } else {
            res.status(403).json({ erro: 'Você não tem permissão para excluir este comentário ou ele não existe' });
        }
    } catch (error) {
        console.error('Erro ao excluir comentário:', error);
        res.status(500).json({ erro: 'Erro ao excluir comentário' });
    }
});

module.exports = router; 