const mysql = require('mysql2/promise');

async function connect() {
  if (global.connection && global.connection.state !== 'disconnected')
    return global.connection;

  const connection = await mysql.createConnection("mysql://root:admin321@localhost:3306/residuos_db");
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

async function insertDenuncia(usuario_id, latitude, longitude, descricao, foto_url) {
  const conn = await connect();
  const sql = 'INSERT INTO Denuncias (usuario_id, latitude, longitude, descricao, foto_url) VALUES (?, ?, ?, ?, ?);';
  await conn.query(sql, [usuario_id, latitude, longitude, descricao, foto_url]);
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


// Exporta as funções para que possam ser usadas em outros arquivos
module.exports = {
  selectUsuarios,
  insertUsuario,
  selectDenuncias,
  insertDenuncia,
  getUsuarioById,
  updateUsuario,
  deleteUsuario,
  votar,
  comentar
};

