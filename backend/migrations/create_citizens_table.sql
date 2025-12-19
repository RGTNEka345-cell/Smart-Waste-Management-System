-- Updated citizens table with OTP fields
CREATE TABLE citizens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password VARCHAR(255) NOT NULL,
  address TEXT,
  date_of_birth DATE,
  gender ENUM('Male','Female','Other') DEFAULT 'Male',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  photo_url VARCHAR(255),
  
  -- OTP Verification fields
  otp_code VARCHAR(6),
  otp_expires_at DATETIME,
  is_verified BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);