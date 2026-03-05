CREATE TABLE illegal_dumping_photos (
  photo_id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,

  photo_url VARCHAR(255) NOT NULL,

  -- Citizen submit = BEFORE, Collector cleanup proof = AFTER
  photo_type ENUM('BEFORE','AFTER') NOT NULL,

  uploaded_by_role ENUM('CITIZEN','COLLECTOR') NOT NULL,
  uploaded_by_id INT NOT NULL,  -- citizen_id or collector_id (role එකෙන් interpret කරන්න)

  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_dump_photo_report
    FOREIGN KEY (report_id) REFERENCES illegal_dumping_reports(report_id)
    ON DELETE CASCADE,

  INDEX idx_dump_photo_report (report_id),
  INDEX idx_dump_photo_type (report_id, photo_type)
) ENGINE=InnoDB;