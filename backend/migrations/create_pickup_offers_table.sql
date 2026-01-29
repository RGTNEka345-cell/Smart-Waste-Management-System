CREATE TABLE pickup_offers (
  offer_id INT AUTO_INCREMENT PRIMARY KEY,

  request_id INT NOT NULL,
  collector_id INT NOT NULL,

  attempt_no INT NOT NULL,

  offer_status ENUM(
    'OFFERED',
    'ACCEPTED',
    'REJECTED',
    'EXPIRED',
    'CANCELLED'
  ) NOT NULL DEFAULT 'OFFERED',

  offered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  offer_expires_at DATETIME NOT NULL,
  responded_at DATETIME NULL,

  /* ===============================
     BASE LOCATION SOURCE (STRICT)
     =============================== */

  base_type ENUM('GOVERNMENT','FACTORY') NOT NULL,

  -- ONLY ONE of these will be filled (based on base_type)
  government_id INT NULL,
  factory_id INT NULL,

  distance_km DECIMAL(8,2) NULL,
  reject_reason TEXT NULL,

  /* ===============================
     FOREIGN KEYS
     =============================== */

  CONSTRAINT fk_po_request
    FOREIGN KEY (request_id)
    REFERENCES pickup_requests(request_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_po_collector
    FOREIGN KEY (collector_id)
    REFERENCES collectors(collector_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_po_government
    FOREIGN KEY (government_id)
    REFERENCES government_details(government_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_po_factory
    FOREIGN KEY (factory_id)
    REFERENCES factory_details(factory_id)
    ON DELETE CASCADE,

  /* ===============================
     DATA CONSISTENCY RULE
     =============================== */
  CONSTRAINT chk_base_source CHECK (
    (base_type = 'GOVERNMENT' AND government_id IS NOT NULL AND factory_id IS NULL)
 OR (base_type = 'FACTORY'    AND factory_id IS NOT NULL    AND government_id IS NULL)
  ),

  UNIQUE KEY uq_request_attempt (request_id, attempt_no),
  INDEX idx_po_collector_status (collector_id, offer_status),
  INDEX idx_po_expiry (offer_status, offer_expires_at)

) ENGINE=InnoDB;