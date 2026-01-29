CREATE TABLE pickup_jobs (
  job_id INT AUTO_INCREMENT PRIMARY KEY,

  request_id INT NOT NULL,
  offer_id INT NOT NULL,

  job_status ENUM('NOT_STARTED','STARTED','ARRIVED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'NOT_STARTED',

  started_at DATETIME NULL,
  arrived_at DATETIME NULL,
  completed_at DATETIME NULL,

  collector_notes TEXT NULL,

  CONSTRAINT fk_pj_request
    FOREIGN KEY (request_id) REFERENCES pickup_requests(request_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_pj_offer
    FOREIGN KEY (offer_id) REFERENCES pickup_offers(offer_id)
    ON DELETE CASCADE,

  UNIQUE KEY uq_one_job_per_request (request_id),
  INDEX idx_pj_status (job_status),
  INDEX idx_pj_completed (completed_at)
) ENGINE=InnoDB;