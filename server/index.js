require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Importação das rotas
const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const denunciasRoutes = require('./routes/denuncias.routes');
const comentariosRoutes = require('./routes/comentarios.routes');

// URL de conexão para o PostgreSQL
const databaseUrl = process.env.DATABASE_URL || "postgresql://ecovigia_db_user:btRPsATAwCC19EjuQmPAbkbIykpvLk54@dpg-d0l0iv2dbo4c73b6rci0-a/ecovigia_db";

const sslConfig = process.env.NODE_ENV === 'production' 
  ? { ssl: { rejectUnauthorized: false } } 
  : {};

// Inicializa o banco de dados
async function initDatabase() {
  const pool = new Pool({
    connectionString: databaseUrl,
    ...sslConfig
  });

  try {
    // Conecta ao banco de dados
    const client = await pool.connect();
    console.log("Conectado ao PostgreSQL para inicialização do banco!");

    // Lê o arquivo schema.sql
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'database', 'schema.sql'),
      'utf8'
    );

    // Executa o script SQL
    await client.query(schemaSQL);
    console.log("Esquema de banco de dados criado com sucesso!");

    // Libera a conexão
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error);
    return false;
  }
}

const app = express();
const PORT = process.env.PORT || 10000;

// Configurações do middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar pasta de uploads como estática
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rota para documentação da API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Rotas da API
app.use('/auth', authRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/denuncias', denunciasRoutes);
app.use('/comentarios', comentariosRoutes);

// Inicializar o banco e iniciar o servidor
initDatabase()
  .then(() => {
    // Inicia o servidor
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Falha ao inicializar o aplicativo:', error);
    process.exit(1);
  });