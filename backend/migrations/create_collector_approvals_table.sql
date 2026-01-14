CREATE TABLE Collector_Approvals (
  approval_id INT AUTO_INCREMENT PRIMARY KEY,
  collector_id INT NOT NULL,
  admin_id INT NOT NULL,
  approved_collection_type ENUM('government','factory') NOT NULL,
  assigned_radius_km DECIMAL(5,2),
  approval_status ENUM('APPROVED','REJECTED') NOT NULL,
  remarks TEXT,
  approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_approval_collector
    FOREIGN KEY (collector_id)
    REFERENCES Collectors(collector_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_approval_admin
    FOREIGN KEY (admin_id)
    REFERENCES Admins(admin_id)
    ON DELETE CASCADE
);
