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

const JWT_SECRET = require('crypto').randomBytes(64).toString('hex');
const REFRESH_TOKEN_SECRET = require('crypto').randomBytes(64).toString('hex');

let refreshTokens = [];

// Middleware para verificar autenticação
const isAuthenticated = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
};

// Middleware para verificar permissões de administrador
const isAdmin = (req, res, next) => {
  if (req.usuario && req.usuario.tipo === 'admin') {
    next();
  } else {
    res.status(403).json({ erro: 'Acesso negado. Permissão de administrador necessária.' });
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
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );
    
    refreshTokens.push(refreshToken);
    
    res.json({
      mensagem: 'Login realizado com sucesso!',
      token,
      refreshToken,
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

app.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ erro: 'Refresh token não fornecido.' });
  }
  
  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json({ erro: 'Refresh token inválido.' });
  }
  
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    
    const token = jwt.sign(
      { id: decoded.id, nome: decoded.nome, email: decoded.email, tipo: decoded.tipo },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({ token });
  } catch (error) {
    refreshTokens = refreshTokens.filter(token => token !== refreshToken);
    res.status(403).json({ erro: 'Refresh token inválido ou expirado.' });
  }
});

app.post('/logout', (req, res) => {
  const { refreshToken } = req.body;
  
  refreshTokens = refreshTokens.filter(token => token !== refreshToken);
  
  res.status(204).send();
});

app.get('/verificar-token', isAuthenticated, (req, res) => {
  res.json({ 
    valido: true, 
    usuario: req.usuario 
  });
});

app.get('/usuarios', isAuthenticated, isAdmin, async (req, res) => {
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

app.get('/usuarios/:id', isAuthenticated, async (req, res) => {
  const id = req.params.id;
  
  if (req.usuario.tipo !== 'admin' && req.usuario.id != id) {
    return res.status(403).json({ erro: 'Acesso negado. Você não tem permissão para acessar este recurso.' });
  }
  
  try {
    const usuario = await db.getUsuarioById(id);
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar usuário.', detalhes: err.message });
  }
});

app.put('/usuarios/:id', isAuthenticated, async (req, res) => {
  const id = req.params.id;
  
  // Verificar se o usuário é admin ou o próprio usuário
  if (req.usuario.tipo !== 'admin' && req.usuario.id != id) {
    return res.status(403).json({ erro: 'Acesso negado. Você não tem permissão para atualizar este usuário.' });
  }
  
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

app.delete('/usuarios/:id', isAuthenticated, async (req, res) => {
  const id = req.params.id;
  
  if (req.usuario.tipo !== 'admin' && req.usuario.id != id) {
    return res.status(403).json({ erro: 'Acesso negado. Você não tem permissão para remover este usuário.' });
  }
  
  try {
    await db.deleteUsuario(id);
    res.json({ mensagem: 'Usuário removido com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao remover usuário.', detalhes: err.message });
  }
});

app.get('/denuncias', async (req, res) => {
  try {
    const denuncias = await db.selectDenuncias();
    res.json(denuncias);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar denúncias', detalhes: err.message });
  }
});

app.post('/denuncias', isAuthenticated, async (req, res) => {
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

app.post('/votos', isAuthenticated, async (req, res) => {
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