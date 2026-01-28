CREATE TABLE notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,

  recipient_role ENUM('CITIZEN','ADMIN','COLLECTOR') NOT NULL,
  recipient_id INT NOT NULL,

  request_id INT NULL,
  assignment_id INT NULL,
  job_id INT NULL,

  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,

  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME NULL,

  CONSTRAINT fk_notif_request
    FOREIGN KEY (request_id) REFERENCES pickup_requests(request_id)
    ON DELETE SET NULL,

  CONSTRAINT fk_notif_assignment
    FOREIGN KEY (assignment_id) REFERENCES pickup_assignments(assignment_id)
    ON DELETE SET NULL,

  CONSTRAINT fk_notif_job
    FOREIGN KEY (job_id) REFERENCES pickup_jobs(job_id)
    ON DELETE SET NULL,

  INDEX idx_notif_recipient (recipient_role, recipient_id, is_read, created_at),
  INDEX idx_notif_request (request_id)
) ENGINE=InnoDB;