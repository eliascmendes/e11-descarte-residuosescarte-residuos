const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Configuração do CORS
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Servir arquivos de img estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas
const denunciasRoutes = require('./routes/denuncias.routes');
const votosRoutes = require('./routes/votos.routes');
const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');

app.use('/denuncias', denunciasRoutes);
app.use('/votos', votosRoutes);
app.use('/auth', authRoutes);
app.use('/usuarios', usuariosRoutes);

// Rota de status do servidor
app.get('/status', (req, res) => {
    res.json({ status: 'online' });
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});