CREATE TABLE pickup_requests (
  request_id INT AUTO_INCREMENT PRIMARY KEY,

  citizen_id INT NOT NULL,

  -- NORMAL = government, SPECIAL = factory
  request_type ENUM('NORMAL','SPECIAL') NOT NULL,

  -- request routing type
  target_collection_type ENUM('government','factory') NOT NULL,

  -- snapshot pickup location (citizen location change උනත් request එක වෙනස් නොවෙයි)
  pickup_latitude DECIMAL(10,8) NOT NULL,
  pickup_longitude DECIMAL(11,8) NOT NULL,
  pickup_address TEXT NULL,

  note TEXT NULL,

  status ENUM(
    'PENDING_ADMIN',
    'REJECTED_ADMIN',
    'APPROVED_ADMIN',
    'ASSIGNING',
    'FAILED_TO_ASSIGN',
    'ACCEPTED_BY_COLLECTOR',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED_BY_CITIZEN'
  ) NOT NULL DEFAULT 'PENDING_ADMIN',

  -- controls assignment loop (infinite loop avoid)
  max_attempts INT NOT NULL DEFAULT 10,
  current_attempt INT NOT NULL DEFAULT 0,

  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  admin_decided_at DATETIME NULL,
  accepted_at DATETIME NULL,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  cancelled_at DATETIME NULL,

  CONSTRAINT fk_pr_citizen
    FOREIGN KEY (citizen_id) REFERENCES citizens(id)
    ON DELETE CASCADE,

  INDEX idx_pr_status_time (status, requested_at),
  INDEX idx_pr_citizen_time (citizen_id, requested_at),
  INDEX idx_pr_type (target_collection_type, request_type)
) ENGINE=InnoDB;