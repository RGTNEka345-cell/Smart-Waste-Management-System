CREATE TABLE Government_Details (
  government_id INT AUTO_INCREMENT PRIMARY KEY,
  collector_id INT NOT NULL,
  service_number VARCHAR(100) NOT NULL,
  department_name VARCHAR(150) NOT NULL,
  working_area_name VARCHAR(150),
  working_area_latitude DECIMAL(10,8),
  working_area_longitude DECIMAL(11,8),
  designation VARCHAR(100),

  CONSTRAINT fk_government_collector
    FOREIGN KEY (collector_id)
    REFERENCES Collectors(collector_id)
    ON DELETE CASCADE
);
