CREATE TABLE eco_tips (
  tip_id INT AUTO_INCREMENT PRIMARY KEY,

  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,

  category ENUM('recycle','reduce','reuse','compost','energy','water','plastic','general')
    DEFAULT 'general',

  difficulty ENUM('easy','medium','hard') DEFAULT 'easy',

  -- ✅ who should see this tip
  audience ENUM('CITIZEN','COLLECTOR','BOTH') DEFAULT 'BOTH',

  image_url VARCHAR(255) NULL,
  source_url VARCHAR(255) NULL,

  is_published BOOLEAN DEFAULT TRUE,

  created_by_admin_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_ecotips_admin
    FOREIGN KEY (created_by_admin_id)
    REFERENCES admins(admin_id)
    ON DELETE RESTRICT,

  INDEX idx_ecotips_audience (audience),
  INDEX idx_ecotips_category (category),
  INDEX idx_ecotips_publish_time (is_published, created_at)
) ENGINE=InnoDB;
