const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Chave secreta para JWT
const SECRET_KEY = 'chave_secreta_do_projeto_descarte_residuos';

// Middleware para verificar autenticação
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

// Rota de login
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
    
    // Gerar token JWT
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

// Rota para verificar token
app.get('/verificar-token', verificarToken, (req, res) => {
  res.json({ 
    valido: true, 
    usuario: req.usuario 
  });
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
    // Verificar se email já existe
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

// Listar denúncias
app.get('/denuncias', async (req, res) => {
  try {
    const denuncias = await db.selectDenuncias();
    res.json(denuncias);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar denúncias', detalhes: err.message });
  }
});

// Criar denúncia (rota protegida)
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

// Votar em denúncia (rota protegida)
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

// Comentar em denúncia (rota protegida)
app.post('/comentarios', verificarToken, async (req, res) => {
  const { denuncia_id, texto } = req.body;
  const usuario_id = req.usuario.id;

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
