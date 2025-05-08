// Elias comentário
// Matheus comentário
const db = require("././db");
console.log ('Start')

const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Servidor funcionando!');
});

const port = 3000;
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});