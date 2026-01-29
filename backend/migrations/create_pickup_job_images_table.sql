CREATE TABLE pickup_job_images (
  image_id INT AUTO_INCREMENT PRIMARY KEY,

  job_id INT NOT NULL,

  image_url VARCHAR(255) NOT NULL,
  image_type ENUM('BEFORE','AFTER','OTHER') DEFAULT 'OTHER',

  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_pji_job
    FOREIGN KEY (job_id) REFERENCES pickup_jobs(job_id)
    ON DELETE CASCADE,

  INDEX idx_pji_job (job_id)
) ENGINE=InnoDB;