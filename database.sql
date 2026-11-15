CREATE DATABASE IF NOT EXISTS db_thomas_abracadabra;
USE db_thomas_abracadabra;

-- 1. Tabel Admin
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Layanan Utama & Add-on (Durasi standar ± 1 jam per acara)
CREATE TABLE services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  type ENUM('main', 'addon') NOT NULL DEFAULT 'main',
  price INT NOT NULL DEFAULT 0,
  description TEXT,
  image_url VARCHAR(255) DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Tabel Katalog Kostum Badut Karakter
CREATE TABLE characters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  price INT NOT NULL DEFAULT 0,
  image_url VARCHAR(255) DEFAULT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Tabel Header Pesanan (Bookings)
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_code VARCHAR(30) NOT NULL UNIQUE,
  customer_name VARCHAR(120) NOT NULL,
  whatsapp_number VARCHAR(30) NOT NULL,
  child_name VARCHAR(120) NOT NULL,
  child_age INT DEFAULT NULL,
  event_date DATE NOT NULL,
  event_time VARCHAR(20) NOT NULL,
  event_address TEXT NOT NULL,
  notes TEXT,
  total_price INT NOT NULL DEFAULT 0,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. Tabel Rincian Item per Pesanan
CREATE TABLE booking_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  item_type ENUM('service', 'character') NOT NULL,
  service_id INT DEFAULT NULL,
  character_id INT DEFAULT NULL,
  item_name VARCHAR(150) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price INT NOT NULL DEFAULT 0,
  subtotal INT NOT NULL DEFAULT 0,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE SET NULL
);

-- Data awal contoh (Harga Rp 0 agar siap diisi sendiri dari halaman Admin)
INSERT INTO services (name, type, price, description, is_active) VALUES
('Badut MC & Sulap', 'main', 0, 'Pemandu acara ulang tahun ceria, games interaktif anak, dan atraksi sulap hiburan (± 1 jam).', TRUE),
('Organ Tunggal', 'addon', 0, 'Hiburan musik keyboard & penyanyi untuk memeriahkan suasana pesta ulang tahun (± 1 jam).', TRUE),
('Fotografer Acara', 'addon', 0, 'Dokumentasi foto momen tiup lilin, potong kue, dan keseruan acara (± 1 jam).', TRUE);

INSERT INTO characters (name, price, is_available) VALUES
('Spider-Man', 0, TRUE),
('Elsa Frozen', 0, TRUE),
('Doraemon', 0, TRUE),
('Mickey Mouse', 0, TRUE);