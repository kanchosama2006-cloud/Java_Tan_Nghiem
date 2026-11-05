-- Do an Web Caro 3x3 (Spring Boot + JPA + JDBC) - MySQL
-- Chay file nay trong MySQL Workbench / phpMyAdmin / dong lenh mysql

CREATE DATABASE IF NOT EXISTS caro_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE caro_db;

-- 1. Bang vai tro (ADMIN / PLAYER)
CREATE TABLE roles (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(20) NOT NULL UNIQUE
);

-- 2. Bang nguoi dung (dang nhap / dang xuat)
CREATE TABLE users (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,            -- luu ma BCrypt, khong luu mat khau thuong
  full_name     VARCHAR(100) NOT NULL,
  role_id       INT NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- 3. Bang van dau (2 nguoi choi chung 1 may, do 1 tai khoan dang nhap tao ra)
CREATE TABLE games (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT NOT NULL,                    -- tai khoan dang nhap
  player_x    VARCHAR(50) NOT NULL,               -- ten nguoi choi X
  player_o    VARCHAR(50) NOT NULL,               -- ten nguoi choi O
  winner      ENUM('X','O','DRAW') NOT NULL,
  started_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at DATETIME NULL,
  CONSTRAINT fk_games_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 4. Bang nuoc di (de xem lai van dau)
CREATE TABLE moves (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  game_id    BIGINT NOT NULL,
  move_order TINYINT NOT NULL,                    -- nuoc thu 1..9
  row_idx    TINYINT NOT NULL,                    -- 0..2
  col_idx    TINYINT NOT NULL,                    -- 0..2
  symbol     ENUM('X','O') NOT NULL,
  CONSTRAINT fk_moves_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  CONSTRAINT uq_move UNIQUE (game_id, move_order)
);

-- 5. Bang thong ke theo tai khoan (dung cho bang xep hang)
CREATE TABLE scores (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT NOT NULL UNIQUE,
  games_played INT NOT NULL DEFAULT 0,
  x_wins       INT NOT NULL DEFAULT 0,
  o_wins       INT NOT NULL DEFAULT 0,
  draws        INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_scores_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Du lieu mau ban dau
INSERT INTO roles (name) VALUES ('ADMIN'), ('PLAYER');
