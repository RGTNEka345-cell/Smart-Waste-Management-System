CREATE TABLE illegal_dumping_reports (
  report_id INT AUTO_INCREMENT PRIMARY KEY,

  -- Citizen only
  reported_by_citizen_id INT NOT NULL,

  title VARCHAR(150) NULL,
  description TEXT NOT NULL,
  severity ENUM('LOW','MEDIUM','HIGH') DEFAULT 'MEDIUM',

  -- reported location snapshot
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  address TEXT NULL,

  -- ✅ prevent duplicate same place reports (approx)
  lat_key DECIMAL(10,5) AS (ROUND(latitude, 5)) STORED,
  lng_key DECIMAL(10,5) AS (ROUND(longitude, 5)) STORED,

  -- when open=1, same location cannot be reported again
  is_open BOOLEAN DEFAULT TRUE,

  status ENUM(
    'PENDING_ADMIN',
    'REJECTED_ADMIN',
    'APPROVED_ADMIN',
    'OFFERING',              -- offering to collectors
    'ACCEPTED_BY_COLLECTOR',
    'IN_PROGRESS',
    'CLEANED'
  ) DEFAULT 'PENDING_ADMIN',

  admin_id INT NULL,
  admin_remarks TEXT NULL,
  approved_at DATETIME NULL,
  rejected_at DATETIME NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_dump_report_citizen
    FOREIGN KEY (reported_by_citizen_id) REFERENCES citizens(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_dump_report_admin
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id)
    ON DELETE SET NULL,

  -- ✅ 핵심: same rounded location cannot have 2 open reports
  UNIQUE KEY uq_open_location (lat_key, lng_key, is_open),

  INDEX idx_dump_status_time (status, created_at),
  INDEX idx_dump_geo (latitude, longitude)
) ENGINE=InnoDB;