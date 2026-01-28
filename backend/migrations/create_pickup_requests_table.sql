CREATE TABLE pickup_requests (
  request_id INT AUTO_INCREMENT PRIMARY KEY,

  citizen_id INT NOT NULL,

  -- NORMAL = government, SPECIAL = factory
  request_type ENUM('NORMAL','SPECIAL') NOT NULL,
  target_collection_type ENUM('government','factory') NOT NULL,

  -- snapshot of pickup point at the time of request (citizen table change උනත් request එකට බලපාන්නේ නැති වෙන්න)
  pickup_latitude DECIMAL(10,8) NOT NULL,
  pickup_longitude DECIMAL(11,8) NOT NULL,
  pickup_address TEXT NULL,

  note TEXT NULL,

  -- request status (system-wide)
  status ENUM(
    'PENDING_ADMIN',        -- citizen just submitted
    'REJECTED_ADMIN',       -- admin rejected
    'APPROVED_ADMIN',       -- admin approved (ready to assign)
    'ASSIGNING',            -- offering to collectors
    'ACCEPTED_BY_COLLECTOR',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED_BY_CITIZEN'
  ) DEFAULT 'PENDING_ADMIN',

  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cancelled_at DATETIME NULL,

  CONSTRAINT fk_pickuprequest_citizen
    FOREIGN KEY (citizen_id) REFERENCES citizens(id)
    ON DELETE CASCADE,

  INDEX idx_pickuprequest_citizen (citizen_id),
  INDEX idx_pickuprequest_status_time (status, requested_at),
  INDEX idx_pickuprequest_type (target_collection_type, request_type)
) ENGINE=InnoDB;