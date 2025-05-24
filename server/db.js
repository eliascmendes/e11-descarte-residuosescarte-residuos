const { Pool } = require('pg');

async function connect() {
  if (global.connection && global.connection.state !== 'disconnected')
    return global.connection;

  // URL de conexão para o PostgreSQL no Render
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("Erro: A variável de ambiente DATABASE_URL não está definida.");
    throw new Error("DATABASE_URL não definida");
  }

  const sslConfig = process.env.NODE_ENV === 'production' 
    ? { ssl: { rejectUnauthorized: false } } 
    : {};

  try {
    const pool = new Pool({
      connectionString: databaseUrl,
      ...sslConfig
    });
    
    // Testar a conexão
    const client = await pool.connect();
    console.log("Conectado ao PostgreSQL!");
    client.release();
    
    global.connection = pool;
    return pool;
  } catch (error) {
    console.error("Erro ao conectar ao PostgreSQL:", error);
    throw error;
  }
}

// Usuários
async function selectUsuarios() {
  const conn = await connect();
  const { rows } = await conn.query('SELECT * FROM Usuarios;');
  return rows;
}

async function selectUsuarioPorEmail(email) {
  const conn = await connect();
  const { rows } = await conn.query('SELECT * FROM Usuarios WHERE email = $1;', [email]);
  return rows;
}

async function insertUsuario(nome, email, senha) {
  const conn = await connect();
  const sql = 'INSERT INTO Usuarios (nome, email, senha, tipo) VALUES ($1, $2, $3, \'morador\');';
  await conn.query(sql, [nome, email, senha]);
}

// Denúncias
async function selectDenuncias() {
  const conn = await connect();
  const { rows } = await conn.query(`
    SELECT d.*, 
    (SELECT COUNT(*) FROM Votos v WHERE v.denuncia_id = d.id) AS total_votos 
    FROM Denuncias d 
    ORDER BY total_votos DESC;
  `);
  return rows;
}

async function insertDenuncia(usuario_id, latitude, longitude, descricao, foto_url, cidade, cep, rua) {
  const conn = await connect();
  try {
    const sql = `
      INSERT INTO Denuncias (
        usuario_id, 
        latitude, 
        longitude, 
        descricao, 
        foto_url, 
        cidade, 
        cep, 
        rua,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pendente')
      RETURNING *;
    `;
    
    console.log('SQL Query:', sql);
    console.log('Parâmetros:', [usuario_id, latitude, longitude, descricao, foto_url, cidade, cep, rua]);
    
    const { rows } = await conn.query(sql, [
      usuario_id,
      latitude,
      longitude,
      descricao,
      foto_url,
      cidade,
      cep,
      rua
    ]);
    
    return rows[0];
  } catch (err) {
    console.error('Erro na inserção da denúncia:', err);
    throw new Error(`Erro ao inserir denúncia: ${err.message}`);
  }
}

// Votos
async function votar(usuario_id, denuncia_id) {
  const conn = await connect();
  try {
    
    // Verificar se a denúncia existe
    const { rows: denuncia } = await conn.query('SELECT id FROM Denuncias WHERE id = $1', [denuncia_id]);
    if (!denuncia || denuncia.length === 0) {
      throw new Error('Denúncia não encontrada');
    }
    
    // Verificar se o usuário existe
    const { rows: usuario } = await conn.query('SELECT id FROM Usuarios WHERE id = $1', [usuario_id]);
    if (!usuario || usuario.length === 0) {
      throw new Error('Usuário não encontrado');
    }
    
    const sql = 'INSERT INTO Votos (usuario_id, denuncia_id) VALUES ($1, $2) RETURNING *;';
    console.log('SQL Query:', sql);
    console.log('Parâmetros:', [usuario_id, denuncia_id]);
    
    const { rows } = await conn.query(sql, [usuario_id, denuncia_id]);
    console.log('Resultado da inserção:', rows[0]);
    
    return rows[0];
  } catch (error) {
    console.error('Erro ao registrar voto:', error);
    throw error;
  }
}

// Comentários
async function comentar(usuario_id, denuncia_id, texto) {
  const conn = await connect();
  const sql = 'INSERT INTO Comentarios (usuario_id, denuncia_id, texto) VALUES ($1, $2, $3) RETURNING *;';
  const { rows } = await conn.query(sql, [usuario_id, denuncia_id, texto]);
  return rows[0];
}

// Função para buscar comentários de uma denúncia específica
async function getComentariosPorDenuncia(denuncia_id) {
  const conn = await connect();
  try {
    const { rows } = await conn.query(`
      SELECT c.*, u.nome as usuario 
      FROM Comentarios c 
      JOIN Usuarios u ON c.usuario_id = u.id 
      WHERE c.denuncia_id = $1 
      ORDER BY c.data_comentario DESC
    `, [denuncia_id]);
    return rows;
  } catch (error) {
    console.error('Erro ao buscar comentários da denúncia:', error);
    throw error;
  }
}

// Função para excluir um comentário
async function deleteComentario(id, usuario_id) {
  const conn = await connect();
  try {
    const { rowCount } = await conn.query(
      'DELETE FROM Comentarios WHERE id = $1 AND usuario_id = $2',
      [id, usuario_id]
    );
    return rowCount > 0;
  } catch (error) {
    console.error('Erro ao excluir comentário:', error);
    throw error;
  }
}

// Função para buscar um usuário específico pelo ID
async function getUsuarioById(id) {
  const conn = await connect();
  const { rows } = await conn.query('SELECT * FROM usuarios WHERE id = $1;', [id]);
  return rows[0];
}

// Função para atualizar os dados de um usuário (nome, email e senha)
async function updateUsuario(id, nome, email, senha_hash) {
  const conn = await connect();
  const sql = 'UPDATE usuarios SET nome = $1, email = $2, senha = $3 WHERE id = $4;';
  await conn.query(sql, [nome, email, senha_hash, id]);
}

// Função para remover um usuário pelo ID
async function deleteUsuario(id) {
  const conn = await connect();
  await conn.query('DELETE FROM usuarios WHERE id = $1;', [id]);
}

// Funções para denúncias
async function getDenunciaById(id) {
  const conn = await connect();
  const query = 'SELECT * FROM denuncias WHERE id = $1';
  const { rows } = await conn.query(query, [id]);
  return rows[0];
}

async function updateDenuncia(id, latitude, longitude, descricao, foto_url, cidade, cep, rua) {
  const conn = await connect();
  const query = `
    UPDATE denuncias 
    SET latitude = $1, longitude = $2, descricao = $3, foto_url = $4, 
        cidade = $5, cep = $6, rua = $7, updated_at = NOW()
    WHERE id = $8
  `;
  await conn.query(query, [latitude, longitude, descricao, foto_url, cidade, cep, rua, id]);
}

async function deleteDenuncia(id) {
  const conn = await connect();
  const query = 'DELETE FROM denuncias WHERE id = $1';
  await conn.query(query, [id]);
}

async function updateDenunciaStatus(id, status) {
  const conn = await connect();
  const query = 'UPDATE denuncias SET status = $1, updated_at = NOW() WHERE id = $2';
  await conn.query(query, [status, id]);
}

// Funções para votos
async function checkVotoDuplicado(usuario_id, denuncia_id) {
  const conn = await connect();
  
  try {
    const { rows } = await conn.query(
      'SELECT COUNT(*) as count FROM Votos WHERE usuario_id = $1 AND denuncia_id = $2',
      [usuario_id, denuncia_id]
    );
    console.log(rows);
    
    return parseInt(rows[0].count) > 0;
  } catch (error) {
    console.error('Erro ao verificar voto duplicado:', error);
    throw error;
  }
}

async function deleteVoto(id) {
  const conn = await connect();
  await conn.query('DELETE FROM Votos WHERE id = $1', [id]);
}

async function countVotosPorDenuncia(denuncia_id) {
  const conn = await connect();
  const { rows } = await conn.query(
    'SELECT COUNT(*) as total FROM Votos WHERE denuncia_id = $1',
    [denuncia_id]
  );
  return parseInt(rows[0].total);
}

async function getVotosPorUsuario(usuario_id) {
  const conn = await connect();
  const { rows } = await conn.query(
    'SELECT v.*, d.descricao as denuncia_descricao FROM Votos v JOIN Denuncias d ON v.denuncia_id = d.id WHERE v.usuario_id = $1',
    [usuario_id]
  );
  return rows;
}

// Funções para denúncias
async function getDenunciasPorUsuario(usuario_id) {
  const conn = await connect();
  try {
    const { rows } = await conn.query(
      'SELECT * FROM Denuncias WHERE usuario_id = $1 ORDER BY data_criacao DESC',
      [usuario_id]
    );
    return rows;
  } catch (error) {
    console.error('Erro ao buscar denúncias do usuário:', error);
    throw error;
  }
}

// Exporta as funções para que possam ser usadas em outros arquivos
module.exports = {
  connect,
  selectUsuarios,
  selectUsuarioPorEmail,
  insertUsuario,
  selectDenuncias,
  insertDenuncia,
  votar,
  comentar,
  getUsuarioById,
  updateUsuario,
  deleteUsuario,
  getDenunciaById,
  updateDenuncia,
  deleteDenuncia,
  updateDenunciaStatus,
  checkVotoDuplicado,
  deleteVoto,
  countVotosPorDenuncia,
  getVotosPorUsuario,
  getDenunciasPorUsuario,
  getComentariosPorDenuncia,
  deleteComentario
};