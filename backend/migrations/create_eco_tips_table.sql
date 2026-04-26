CREATE TABLE eco_tips (
  tip_id INT AUTO_INCREMENT PRIMARY KEY,

  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,

  category ENUM(
    'recycle',
    'reduce',
    'reuse',
    'compost',
    'energy',
    'water',
    'plastic',
    'general'
  ) NOT NULL DEFAULT 'general',

  difficulty ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'easy',
  audience ENUM('CITIZEN', 'COLLECTOR', 'BOTH') NOT NULL DEFAULT 'BOTH',

  image_url VARCHAR(255) NULL,
  source_url VARCHAR(500) NULL,

  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_by_admin_id INT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_eco_tips_admin
    FOREIGN KEY (created_by_admin_id)
    REFERENCES admins(admin_id)
    ON DELETE SET NULL,

  INDEX idx_eco_tips_audience_pub_created (audience, is_published, created_at),
  INDEX idx_eco_tips_category (category),
  INDEX idx_eco_tips_difficulty (difficulty)
) ENGINE=InnoDB;
