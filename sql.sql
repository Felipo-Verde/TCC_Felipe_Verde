-- Criação da tabela de usuários
CREATE TABLE tb_usuario (
    email_usuario VARCHAR(100) PRIMARY KEY,
    nome_usuario VARCHAR(100) NOT NULL,
    senha_usuario VARCHAR(100) NOT NULL,
    foto_usuario VARCHAR(255),
    tipo_usuario ENUM('professor', 'administrador') NOT NULL
);

-- Criação da tabela de escolas
CREATE TABLE tb_escola (
    id_escola INT AUTO_INCREMENT PRIMARY KEY,
    nome_escola VARCHAR(100) NOT NULL,
    endereco_escola VARCHAR(255) NOT NULL,
    administrador_email_escola VARCHAR(100) NOT NULL,
    FOREIGN KEY (administrador_email_escola) REFERENCES tb_usuario(email_usuario)
);

-- Criação da tabela de turmas
CREATE TABLE tb_turma (
    id_turma INT AUTO_INCREMENT PRIMARY KEY,
    nome_turma VARCHAR(100) NOT NULL,
    turno_turma ENUM('matutino', 'vespertino', 'noturno') NOT NULL,
    escola_id_turma INT NOT NULL,
    FOREIGN KEY (escola_id_turma) REFERENCES tb_escola(id_escola)
);

-- Criação da tabela de disciplinas
CREATE TABLE tb_disciplina (
    id_disciplina INT AUTO_INCREMENT PRIMARY KEY,
    nome_disciplina VARCHAR(100) NOT NULL,
    numalunos_disciplina INT NOT NULL,
    turma_id_disciplina INT NOT NULL,
    professor_email_disciplina VARCHAR(100) NOT NULL,
    FOREIGN KEY (turma_id_disciplina) REFERENCES tb_turma(id_turma),
    FOREIGN KEY (professor_email_disciplina) REFERENCES tb_usuario(email_usuario)
);

-- Criação da tabela de advertências
CREATE TABLE tb_advertencia (
    id_advertencia INT AUTO_INCREMENT PRIMARY KEY,
    disciplina_id_advertencia INT NOT NULL,
    FOREIGN KEY (disciplina_id_advertencia) REFERENCES tb_disciplina(id_disciplina)
);
