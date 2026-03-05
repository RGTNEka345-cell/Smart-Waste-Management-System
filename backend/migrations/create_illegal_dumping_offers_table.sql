CREATE TABLE illegal_dumping_offers (
  offer_id INT AUTO_INCREMENT PRIMARY KEY,

  report_id INT NOT NULL,
  collector_id INT NOT NULL, -- ✅ backend must ensure collector.collection_type='government'

  offer_status ENUM('OFFERED','ACCEPTED','REJECTED','EXPIRED') DEFAULT 'OFFERED',

  -- distance/fuel saving display (optional but useful)
  distance_km DECIMAL(7,2) NULL,

  offered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  offer_expires_at DATETIME NULL,

  responded_at DATETIME NULL,
  reject_reason VARCHAR(200) NULL,

  CONSTRAINT fk_dump_offer_report
    FOREIGN KEY (report_id) REFERENCES illegal_dumping_reports(report_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_dump_offer_collector
    FOREIGN KEY (collector_id) REFERENCES collectors(collector_id)
    ON DELETE CASCADE,

  -- avoid offering same collector twice for same report
  UNIQUE KEY uq_dump_offer_once (report_id, collector_id),

  INDEX idx_dump_offer_status (offer_status, offer_expires_at),
  INDEX idx_dump_offer_report (report_id)
) ENGINE=InnoDB;