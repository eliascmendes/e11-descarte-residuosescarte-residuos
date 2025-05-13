const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const cors = require('cors');

const app = express();
app.use(express.json());

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

const SECRET_KEY = require('crypto').randomBytes(64).toString('hex');

const verificarToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
  }
  
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.usuario = decoded;
    next();
  } catch (error) {
    res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
};

app.get('/', (req, res) => {
  res.send('Servidor funcionando!');
});

app.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  
  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
  }
  
  try {
    const usuarios = await db.selectUsuarioPorEmail(email);
    
    if (usuarios.length === 0) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }
    
    const usuario = usuarios[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }
    
    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo },
      SECRET_KEY,
      { expiresIn: '24h' }
    );
    
    res.json({
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo
      }
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao realizar login.', detalhes: err.message });
  }
});

app.get('/verificar-token', verificarToken, (req, res) => {
  res.json({ 
    valido: true, 
    usuario: req.usuario 
  });
});

app.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await db.selectUsuarios();
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar usuários', detalhes: err.message });
  }
});

app.post('/usuarios', async (req, res) => {
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

app.post('/denuncias', verificarToken, async (req, res) => {
  const { latitude, longitude, descricao, foto_url, cidade, cep, rua } = req.body;
  const usuario_id = req.usuario.id;

  if (!usuario_id || !descricao) {
    return res.status(400).json({ erro: 'Campos obrigatórios faltando.' });
  }

  try {
    await db.insertDenuncia(usuario_id, latitude, longitude, descricao, foto_url || null, cidade, cep, rua);
    res.status(201).json({ mensagem: 'Denúncia registrada com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao registrar denúncia.', detalhes: err.message });
  }
});

app.post('/votos', verificarToken, async (req, res) => {
  const { denuncia_id } = req.body;
  const usuario_id = req.usuario.id;

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
   
const port = 3000;
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});