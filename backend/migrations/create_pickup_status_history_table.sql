CREATE TABLE pickup_status_history (
  history_id INT AUTO_INCREMENT PRIMARY KEY,

  request_id INT NOT NULL,

  old_status VARCHAR(40) NULL,
  new_status VARCHAR(40) NOT NULL,

  changed_by_role ENUM('SYSTEM','CITIZEN','ADMIN','COLLECTOR') NOT NULL,
  changed_by_id INT NULL,

  note TEXT NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_psh_request
    FOREIGN KEY (request_id) REFERENCES pickup_requests(request_id)
    ON DELETE CASCADE,

  INDEX idx_psh_request_time (request_id, changed_at)
) ENGINE=InnoDB;