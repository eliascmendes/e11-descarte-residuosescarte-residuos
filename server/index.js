const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const { isAuthenticated, isAdmin, JWT_SECRET } = require('./middleware/auth');

const app = express();

// Sets de limite de tamanho de requisição
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configuração CORS 
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// routes imports
const denunciasRouter = require('./routes/denuncias.routes');
const votosRouter = require('./routes/votos.routes');

const REFRESH_TOKEN_SECRET = require('crypto').randomBytes(64).toString('hex');

let refreshTokens = [];

/**
 * @swagger
 * tags:
 *   - name: Status
 *     description: Endpoints de status
 *   - name: Autenticação
 *     description: Endpoints de autenticação
 *   - name: Usuários
 *     description: Endpoints de usuários
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: Verifica status do servidor
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: Servidor funcionando
 */
app.get('/', (req, res) => {
  res.send('Servidor funcionando!');
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Realiza login
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado
 */
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

/**
 * @swagger
 * /refresh-token:
 *   post:
 *     summary: Renova token
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token renovado
 */
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

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Realiza logout
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       204:
 *         description: Logout realizado
 */
app.post('/logout', (req, res) => {
  const { refreshToken } = req.body;
  
  refreshTokens = refreshTokens.filter(token => token !== refreshToken);
  
  res.status(204).send();
});

/**
 * @swagger
 * /verificar-token:
 *   get:
 *     summary: Verifica token
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 */
app.get('/verificar-token', isAuthenticated, (req, res) => {
  res.json({ 
    valido: true, 
    usuario: req.usuario 
  });
});

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Lista usuários
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários
 */
app.get('/usuarios', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const usuarios = await db.selectUsuarios();
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar usuários', detalhes: err.message });
  }
});

/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Cadastra usuário
 *     tags: [Usuários]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário cadastrado
 */
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

// importando as routes
app.use('/denuncias', denunciasRouter);
app.use('/votos', votosRouter);

const port = 3000;
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});