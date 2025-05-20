CREATE TABLE Usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('morador', 'administrador'))
);

CREATE TABLE Denuncias (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    descricao TEXT NOT NULL,
    foto_url VARCHAR(255),
    cidade VARCHAR(255) NOT NULL,
    cep VARCHAR(20) NOT NULL,
    rua VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'em andamento', 'resolvido')),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id)
);

CREATE TABLE Votos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    denuncia_id INTEGER NOT NULL,
    data_voto TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id),
    FOREIGN KEY (denuncia_id) REFERENCES Denuncias(id)
);

CREATE TABLE Comentarios (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    denuncia_id INTEGER NOT NULL,
    texto TEXT NOT NULL,
    data_comentario TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id),
    FOREIGN KEY (denuncia_id) REFERENCES Denuncias(id)
);

-- Índices para melhorar a performance de consultas
CREATE INDEX idx_denuncias_localizacao ON Denuncias (latitude, longitude);
CREATE INDEX idx_votos_denuncia ON Votos (denuncia_id);
CREATE INDEX idx_comentarios_denuncia ON Comentarios (denuncia_id);

UPDATE Usuarios SET tipo = 'administrador';