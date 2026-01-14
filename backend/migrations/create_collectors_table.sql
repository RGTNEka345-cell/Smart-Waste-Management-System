CREATE TABLE Collectors (
  collector_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  gender ENUM('Male', 'Female') NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone_number VARCHAR(15) NOT NULL,
  home_address TEXT,
  collection_type ENUM('government','factory') NOT NULL,
  vehicle_photo VARCHAR(255) NOT NULL,
  vehicle_number VARCHAR(50) NOT NULL,
  latitude DECIMAL(10,8) NULL,
  longitude DECIMAL(11,8) NULL,
  status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
