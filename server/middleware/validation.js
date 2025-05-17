const validateDenuncia = (req, res, next) => {
  const { latitude, longitude, descricao, cidade, cep, rua } = req.body;

  // Validação dos campos obrigatórios
  if (!descricao) {
    return res.status(400).json({ erro: 'Descrição é obrigatória' });
  }

  if (!cidade) {
    return res.status(400).json({ erro: 'Cidade é obrigatória' });
  }

  // Validação do formato do CEP (00000-000)
  if (cep && !/^\d{5}-\d{3}$/.test(cep)) {
    return res.status(400).json({ erro: 'CEP deve estar no formato 00000-000' });
  }

  // Validação das coordenadas
  if (latitude && (isNaN(latitude) || latitude < -90 || latitude > 90)) {
    return res.status(400).json({ erro: 'Latitude inválida' });
  }

  if (longitude && (isNaN(longitude) || longitude < -180 || longitude > 180)) {
    return res.status(400).json({ erro: 'Longitude inválida' });
  }

  // Validação do tamanho da descrição
  if (descricao.length < 10) {
    return res.status(400).json({ erro: 'Descrição deve ter no mínimo 10 caracteres' });
  }

  if (descricao.length > 1000) {
    return res.status(400).json({ erro: 'Descrição deve ter no máximo 1000 caracteres' });
  }

  next();
};

const validateStatus = (req, res, next) => {
  const { status } = req.body;
  const statusValidos = ['pendente', 'em andamento', 'resolvido'];

  if (!status || !statusValidos.includes(status)) {
    return res.status(400).json({ 
      erro: 'Status inválido',
      statusValidos: statusValidos
    });
  }

  next();
};

module.exports = {
  validateDenuncia,
  validateStatus
}; 