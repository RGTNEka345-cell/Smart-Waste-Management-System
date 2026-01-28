CREATE TABLE pickup_admin_approvals (
  admin_approval_id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  admin_id INT NOT NULL,

  decision ENUM('APPROVED','REJECTED') NOT NULL,
  remarks TEXT NULL,
  decided_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_adminapproval_request
    FOREIGN KEY (request_id) REFERENCES pickup_requests(request_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_adminapproval_admin
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id)
    ON DELETE CASCADE,

  UNIQUE KEY uq_one_admin_decision_per_request (request_id),
  INDEX idx_adminapproval_admin_time (admin_id, decided_at)
) ENGINE=InnoDB;