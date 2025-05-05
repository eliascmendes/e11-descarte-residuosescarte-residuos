CREATE TABLE Usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  tipo ENUM('morador', 'administrador') NOT NULL
)

CREATE TABLE Denuncias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  descricao TEXT NOT NULL,
  foto_url VARCHAR(255),
  status ENUM('pendente', 'em andamento', 'resolvido') DEFAULT 'pendente',
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES Usuarios(id)
)

CREATE TABLE Votos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  denuncia_id INT NOT NULL,
  data_voto TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES Usuarios(id)
  FOREIGN KEY (denuncia_id) REFERENCES Denuncias(id)
)
