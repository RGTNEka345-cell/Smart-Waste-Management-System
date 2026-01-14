CREATE TABLE Factory_Details (
  factory_id INT AUTO_INCREMENT PRIMARY KEY,
  collector_id INT NOT NULL,
  factory_name VARCHAR(150) NOT NULL,
  factory_licence_no VARCHAR(100) NOT NULL,
  operating_hours VARCHAR(100),
  waste_types_accepted TEXT,
  factory_address TEXT,
  factory_contact VARCHAR(15),
  factory_latitude DECIMAL(10,8),
  factory_longitude DECIMAL(11,8),

  CONSTRAINT fk_factory_collector
    FOREIGN KEY (collector_id)
    REFERENCES Collectors(collector_id)
    ON DELETE CASCADE
);
