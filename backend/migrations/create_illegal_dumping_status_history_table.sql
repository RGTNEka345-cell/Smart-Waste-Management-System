CREATE TABLE illegal_dumping_status_history (
  history_id INT AUTO_INCREMENT PRIMARY KEY,

  report_id INT NOT NULL,
  status VARCHAR(40) NOT NULL,        -- store enums + ARRIVED like events if you want
  note TEXT NULL,

  changed_by_role ENUM('CITIZEN','ADMIN','COLLECTOR') NOT NULL,
  changed_by_id INT NOT NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_dump_history_report
    FOREIGN KEY (report_id) REFERENCES illegal_dumping_reports(report_id)
    ON DELETE CASCADE,

  INDEX idx_dump_history_report (report_id, changed_at)
) ENGINE=InnoDB;