CREATE TABLE eco_points_history (
  history_id INT AUTO_INCREMENT PRIMARY KEY,

  citizen_id INT NULL,
  collector_id INT NULL,
  admin_id INT NULL,

  points INT NOT NULL,

  action_type ENUM(
    'PICKUP_REQUEST',
    'ILLEGAL_DUMP_REPORT',
    'PICKUP_COMPLETED',
    'ILLEGAL_DUMP_CLEANUP_COMPLETED',
    'ECO_ACTIVITY',
    'ADMIN_ADJUST'
  ) NOT NULL,

  reference_id INT NULL, -- request_id / report_id

  description TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_history_citizen
    FOREIGN KEY (citizen_id)
    REFERENCES citizens(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_history_collector
    FOREIGN KEY (collector_id)
    REFERENCES Collectors(collector_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_history_admin
    FOREIGN KEY (admin_id)
    REFERENCES admins(admin_id)
    ON DELETE SET NULL,

  INDEX idx_history_citizen_created (citizen_id, created_at),
  INDEX idx_history_collector_created (collector_id, created_at),
  INDEX idx_history_action_created (action_type, created_at)
);
