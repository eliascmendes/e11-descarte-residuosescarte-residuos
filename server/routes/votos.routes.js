const express = require('express');
const router = express.Router();
const db = require('../db');

console.log('rotas de votos carregadas');

router.get('/', (req, res) => {
  res.send('Votos e Votos');
});

module.exports = router;
// USAR COUNT FOR VOTES NUMBER

// TALVEZ 3 ROTAS CHAMADAS POR DENUNCIA ID PRA CARREGAR OS DETALHES DA DENUNCIA

