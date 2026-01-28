CREATE TABLE pickup_request_photos (
  photo_id INT AUTO_INCREMENT PRIMARY KEY,

  request_id INT NOT NULL,

  photo_url VARCHAR(255) NOT NULL,          -- stored path/url
  photo_type ENUM('GARBAGE','LOCATION','OTHER') DEFAULT 'GARBAGE',

  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_prphoto_request
    FOREIGN KEY (request_id)
    REFERENCES pickup_requests(request_id)
    ON DELETE CASCADE,

  INDEX idx_prphoto_request (request_id)
) ENGINE=InnoDB;