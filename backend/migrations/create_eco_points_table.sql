CREATE TABLE eco_points (
  eco_id INT AUTO_INCREMENT PRIMARY KEY,

  citizen_id INT NULL,
  collector_id INT NULL,

  total_points INT NOT NULL DEFAULT 0,

  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_ecopoints_citizen
    FOREIGN KEY (citizen_id)
    REFERENCES citizens(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_ecopoints_collector
    FOREIGN KEY (collector_id)
    REFERENCES Collectors(collector_id)
    ON DELETE CASCADE,

  UNIQUE KEY uq_ecopoints_citizen (citizen_id),
  UNIQUE KEY uq_ecopoints_collector (collector_id)
);
