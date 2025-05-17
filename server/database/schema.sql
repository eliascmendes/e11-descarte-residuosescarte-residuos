USE residuos_db;
CREATE TABLE IF NOT EXISTS Usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('morador', 'administrador') NOT NULL
);

CREATE TABLE Denuncias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    descricao TEXT NOT NULL,
    foto_url VARCHAR(255),
    cidade VARCHAR(255) NOT NULL,
    cep VARCHAR(20) NOT NULL,
    rua VARCHAR(255) NOT NULL,
    status ENUM('pendente', 'em andamento', 'resolvido') DEFAULT 'pendente',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id)
);

CREATE TABLE Votos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    denuncia_id INT NOT NULL,
    data_voto TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id),
    FOREIGN KEY (denuncia_id) REFERENCES Denuncias(id)
);

CREATE TABLE Comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    denuncia_id INT NOT NULL,
    texto TEXT NOT NULL,
    data_comentario TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id),
    FOREIGN KEY (denuncia_id) REFERENCES Denuncias(id)
);
-- Precisa ser testado.
CREATE INDEX idx_denuncias_localizacao ON Denuncias (latitude, longitude);
CREATE INDEX idx_votos_denuncia ON Votos (denuncia_id);
CREATE INDEX idx_comentarios_denuncia ON Comentarios (denuncia_id);