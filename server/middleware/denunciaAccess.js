const db = require('../db');

const checkDenunciaAccess = async (req, res, next) => {
  const denunciaId = req.params.id;
  const usuarioId = req.usuario.id;
  const isAdmin = req.usuario.tipo === 'admin';

  try {
    const denuncia = await db.getDenunciaById(denunciaId);
    
    if (!denuncia) {
      return res.status(404).json({ erro: 'Denúncia não encontrada' });
    }

    // Verifica se o usuário é o autor da denúncia ou um admin
    if (denuncia.usuario_id !== usuarioId && !isAdmin) {
      return res.status(403).json({ 
        erro: 'Acesso negado',
        mensagem: 'Apenas o autor da denúncia ou um administrador podem realizar esta ação'
      });
    }

    // Adiciona a denúncia ao request pra reaproveitar nas outras rotas
    req.denuncia = denuncia;
    next();
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao verificar acesso', detalhes: err.message });
  }
};

module.exports = {
  checkDenunciaAccess
}; 