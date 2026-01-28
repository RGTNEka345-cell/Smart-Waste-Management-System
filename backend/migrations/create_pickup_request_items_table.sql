CREATE TABLE pickup_request_items (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  wastetype_id INT NOT NULL,

  quantity DECIMAL(10,2) NULL,
  unit ENUM('kg','bag','piece','other') DEFAULT 'other',

  CONSTRAINT fk_pritem_request
    FOREIGN KEY (request_id) REFERENCES pickup_requests(request_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_pritem_wastetype
    FOREIGN KEY (wastetype_id) REFERENCES wastetypes(id)
    ON DELETE RESTRICT,

  UNIQUE KEY uq_request_wastetype (request_id, wastetype_id),
  INDEX idx_pritem_request (request_id),
  INDEX idx_pritem_wastetype (wastetype_id)
) ENGINE=InnoDB;