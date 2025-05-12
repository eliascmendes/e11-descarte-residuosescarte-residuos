const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Servidor funcionando!');
});

// Listar usuários
app.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await db.selectUsuarios();
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar usuários', detalhes: err.message });
  }
});

// Criar novo usuário
app.post('/usuarios', async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    await db.insertUsuario(nome, email, senhaHash);
    res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao cadastrar usuário.', detalhes: err.message });
  }
});

// Buscar usuário específico
app.get('/usuarios/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const usuario = await db.getUsuarioById(id);
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar usuário.', detalhes: err.message });
  }
});

// Atualizar usuário
app.put('/usuarios/:id', async (req, res) => {
  const id = req.params.id;
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

// Remover usuário
app.delete('/usuarios/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await db.deleteUsuario(id);
    res.json({ mensagem: 'Usuário removido com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao remover usuário.', detalhes: err.message });
  }
});

// Listar denúncias
app.get('/denuncias', async (req, res) => {
  try {
    const denuncias = await db.selectDenuncias();
    res.json(denuncias);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar denúncias', detalhes: err.message });
  }
});

// Criar denúncia
app.post('/denuncias', async (req, res) => {
  const { usuario_id, latitude, longitude, descricao, foto_url } = req.body;

  if (!usuario_id || !latitude || !longitude || !descricao) {
    return res.status(400).json({ erro: 'Campos obrigatórios faltando.' });
  }

  try {
    await db.insertDenuncia(usuario_id, latitude, longitude, descricao, foto_url || null);
    res.status(201).json({ mensagem: 'Denúncia registrada com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao registrar denúncia.', detalhes: err.message });
  }
});

// Votar em denúncia
app.post('/votos', async (req, res) => {
  const { usuario_id, denuncia_id } = req.body;

  if (!usuario_id || !denuncia_id) {
    return res.status(400).json({ erro: 'ID do usuário e da denúncia são obrigatórios.' });
  }

  try {
    await db.votar(usuario_id, denuncia_id);
    res.status(201).json({ mensagem: 'Voto registrado com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao registrar voto.', detalhes: err.message });
  }
});

// Comentar em denúncia
app.post('/comentarios', async (req, res) => {
  const { usuario_id, denuncia_id, texto } = req.body;

  if (!usuario_id || !denuncia_id || !texto) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }

  try {
    await db.comentar(usuario_id, denuncia_id, texto);
    res.status(201).json({ mensagem: 'Comentário adicionado com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao adicionar comentário.', detalhes: err.message });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
