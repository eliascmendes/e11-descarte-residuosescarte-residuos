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
  const sql = 'INSERT INTO Denuncias (usuario_id, latitude, longitude, descricao, foto_url, cidade, cep, rua) VALUES (?, ?, ?, ?, ?, ?, ?, ?);';
  await conn.query(sql, [usuario_id, latitude, longitude, descricao, foto_url, cidade, cep, rua]);
}

// Votos
async function votar(usuario_id, denuncia_id) {
  const conn = await connect();
  const sql = 'INSERT INTO Votos (usuario_id, denuncia_id) VALUES (?, ?);';
  await conn.query(sql, [usuario_id, denuncia_id]);
}

module.exports = {
  selectUsuarios,
  selectUsuarioPorEmail,
  insertUsuario,
  selectDenuncias,
  insertDenuncia,
  votar,
  comentar
};

