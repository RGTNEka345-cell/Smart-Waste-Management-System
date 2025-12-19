CREATE TABLE admins (
  admin_id INT AUTO_INCREMENT PRIMARY KEY,
  fullname VARCHAR(100) NOT NULL,
  gender ENUM('Male','Female','Other'),
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  photo VARCHAR(255),
  phone_number VARCHAR(20),
  address TEXT,
  role ENUM('main_admin','sub_admin') DEFAULT 'sub_admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
