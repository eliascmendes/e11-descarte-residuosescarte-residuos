const mysql = require('mysql2/promise');

async function connect() {
  if (global.connection && global.connection.state !== 'disconnected')
    return global.connection;

  const connection = await mysql.createConnection("mysql://root:admin123@localhost:3306/residuos_db");
  console.log("Conectado ao MySQL!");
  global.connection = connection;
  return connection;
}

// Usuários
async function selectUsuarios() {
  const conn = await connect();
  const [rows] = await conn.query('SELECT * FROM Usuarios;');
  return rows;
}

async function selectUsuarioPorEmail(email) {
  const conn = await connect();
  const [rows] = await conn.query('SELECT * FROM Usuarios WHERE email = ?;', [email]);
  return rows;
}

async function insertUsuario(nome, email, senha) {
  const conn = await connect();
  const sql = 'INSERT INTO Usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, "morador");';
  await conn.query(sql, [nome, email, senha]);
}

// Denúncias
async function selectDenuncias() {
  const conn = await connect();
  const [rows] = await conn.query('SELECT * FROM Denuncias;');
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendente');
    `;
    
    console.log('SQL Query:', sql);
    console.log('Parâmetros:', [usuario_id, latitude, longitude, descricao, foto_url, cidade, cep, rua]);
    
    const [result] = await conn.query(sql, [
      usuario_id,
      latitude,
      longitude,
      descricao,
      foto_url,
      cidade,
      cep,
      rua
    ]);
    
    return result;
  } catch (err) {
    console.error('Erro na inserção da denúncia:', err);
    throw new Error(`Erro ao inserir denúncia: ${err.message}`);
  }
}

// Votos
async function votar(usuario_id, denuncia_id) {
  const conn = await connect();
  const sql = 'INSERT INTO Votos (usuario_id, denuncia_id) VALUES (?, ?);';
  await conn.query(sql, [usuario_id, denuncia_id]);
}

// Comentários
async function comentar(usuario_id, denuncia_id, texto) {
  const conn = await connect();
  const sql = 'INSERT INTO Comentarios (usuario_id, denuncia_id, texto) VALUES (?, ?, ?);';
  await conn.query(sql, [usuario_id, denuncia_id, texto]);
}

// Função para buscar um usuário específico pelo ID
async function getUsuarioById(id) {
  const conn = await connect();
  const [rows] = await conn.query('SELECT * FROM usuarios WHERE id = ?;', [id]);
  return rows[0];
}

// Função para atualizar os dados de um usuário (nome, email e senha)
async function updateUsuario(id, nome, email, senha_hash) {
  const conn = await connect();
  const sql = 'UPDATE usuarios SET nome = ?, email = ?, senha = ? WHERE id = ?;';
  await conn.query(sql, [nome, email, senha_hash, id]);
}

// Função para remover um usuário pelo ID
async function deleteUsuario(id) {
  const conn = await connect();
  await conn.query('DELETE FROM usuarios WHERE id = ?;', [id]);
}

// Funções para denúncias
async function getDenunciaById(id) {
  const conn = await connect();
  const query = 'SELECT * FROM denuncias WHERE id = ?';
  const [rows] = await conn.query(query, [id]);
  return rows[0];
}

async function updateDenuncia(id, latitude, longitude, descricao, foto_url, cidade, cep, rua) {
  const conn = await connect();
  const query = `
    UPDATE denuncias 
    SET latitude = ?, longitude = ?, descricao = ?, foto_url = ?, 
        cidade = ?, cep = ?, rua = ?, updated_at = NOW()
    WHERE id = ?
  `;
  await conn.query(query, [latitude, longitude, descricao, foto_url, cidade, cep, rua, id]);
}

async function deleteDenuncia(id) {
  const conn = await connect();
  const query = 'DELETE FROM denuncias WHERE id = ?';
  await conn.query(query, [id]);
}

async function updateDenunciaStatus(id, status) {
  const conn = await connect();
  const query = 'UPDATE denuncias SET status = ?, updated_at = NOW() WHERE id = ?';
  await conn.query(query, [status, id]);
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
  updateDenunciaStatus
};