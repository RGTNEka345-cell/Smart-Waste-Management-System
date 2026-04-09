CREATE TABLE website_settings (
  setting_id INT AUTO_INCREMENT PRIMARY KEY,

  site_logo VARCHAR(255) NOT NULL,

  updated_by_admin INT NOT NULL,

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_logo_admin
    FOREIGN KEY (updated_by_admin)
    REFERENCES admins(admin_id)
    ON DELETE CASCADE
);
