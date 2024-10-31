-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 09/10/2024 às 01:37
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `barulhometro`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `tb_advertencia`
--

CREATE TABLE `tb_advertencia` (
  `id_advertencia` int(11) NOT NULL,
  `disciplina_id_advertencia` int(11) NOT NULL,
  PRIMARY KEY (`id_advertencia`),
  KEY `disciplina_id_advertencia` (`disciplina_id_advertencia`),
  CONSTRAINT `tb_advertencia_ibfk_1` FOREIGN KEY (`disciplina_id_advertencia`) REFERENCES `tb_disciplina` (`id_disciplina`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tb_disciplina`
--

CREATE TABLE `tb_disciplina` (
  `id_disciplina` int(11) NOT NULL,
  `nome_disciplina` varchar(100) NOT NULL,
  `turma_id_disciplina` int(11) NOT NULL,
  `professor_email_disciplina` varchar(100) NOT NULL,
  PRIMARY KEY (`id_disciplina`),
  KEY `turma_id_disciplina` (`turma_id_disciplina`),
  KEY `professor_email_disciplina` (`professor_email_disciplina`),
  CONSTRAINT `tb_disciplina_ibfk_1` FOREIGN KEY (`turma_id_disciplina`) REFERENCES `tb_turma` (`id_turma`) ON DELETE CASCADE,
  CONSTRAINT `tb_disciplina_ibfk_2` FOREIGN KEY (`professor_email_disciplina`) REFERENCES `tb_usuario` (`email_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tb_escola`
--

CREATE TABLE `tb_escola` (
  `id_escola` int(11) NOT NULL,
  `nome_escola` varchar(100) NOT NULL,
  `endereco_escola` varchar(255) NOT NULL,
  `foto_escola` varchar(100) NOT NULL,
  `administrador_email_escola` varchar(100) NOT NULL,
  PRIMARY KEY (`id_escola`),
  KEY `administrador_email_escola` (`administrador_email_escola`),
  CONSTRAINT `tb_escola_ibfk_1` FOREIGN KEY (`administrador_email_escola`) REFERENCES `tb_usuario` (`email_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tb_turma`
--

CREATE TABLE `tb_turma` (
  `id_turma` int(11) NOT NULL,
  `nome_turma` varchar(100) NOT NULL,
  `turno_turma` enum('matutino','vespertino','noturno') NOT NULL,
  `numalunos_turma` int(11) NOT NULL,
  `escola_id_turma` int(11) NOT NULL,
  PRIMARY KEY (`id_turma`),
  KEY `escola_id_turma` (`escola_id_turma`),
  CONSTRAINT `tb_turma_ibfk_1` FOREIGN KEY (`escola_id_turma`) REFERENCES `tb_escola` (`id_escola`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tb_usuario`
--

CREATE TABLE `tb_usuario` (
  `email_usuario` varchar(100) NOT NULL,
  `nome_usuario` varchar(100) NOT NULL,
  `senha_usuario` varchar(100) NOT NULL,
  `foto_usuario` varchar(255) DEFAULT NULL,
  `tipo_usuario` enum('professor','administrador') NOT NULL,
  PRIMARY KEY (`email_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

-- AUTO_INCREMENT para tabelas despejadas

-- AUTO_INCREMENT de tabela `tb_advertencia`
ALTER TABLE `tb_advertencia`
  MODIFY `id_advertencia` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

-- AUTO_INCREMENT de tabela `tb_disciplina`
ALTER TABLE `tb_disciplina`
  MODIFY `id_disciplina` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

-- AUTO_INCREMENT de tabela `tb_escola`
ALTER TABLE `tb_escola`
  MODIFY `id_escola` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

-- AUTO_INCREMENT de tabela `tb_turma`
ALTER TABLE `tb_turma`
  MODIFY `id_turma` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

-- --------------------------------------------------------

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
