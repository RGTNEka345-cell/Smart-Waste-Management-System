CREATE TABLE message_conversations (
  conversation_id INT AUTO_INCREMENT PRIMARY KEY,
  subject VARCHAR(180) NOT NULL DEFAULT 'Direct Message',
  created_by_role ENUM('CITIZEN','COLLECTOR','ADMIN') NOT NULL,
  created_by_id INT NOT NULL,
  last_message TEXT NULL,
  last_message_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mc_updated (updated_at),
  INDEX idx_mc_creator (created_by_role, created_by_id)
) ENGINE=InnoDB;

CREATE TABLE message_participants (
  participant_id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  user_role ENUM('CITIZEN','COLLECTOR','ADMIN') NOT NULL,
  user_id INT NOT NULL,
  last_read_at DATETIME NULL,
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_mp_user_conversation (conversation_id, user_role, user_id),
  INDEX idx_mp_user (user_role, user_id),
  CONSTRAINT fk_mp_conversation
    FOREIGN KEY (conversation_id) REFERENCES message_conversations(conversation_id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE messages (
  message_id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_role ENUM('CITIZEN','COLLECTOR','ADMIN') NOT NULL,
  sender_id INT NOT NULL,
  body TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_m_conversation (conversation_id, created_at),
  CONSTRAINT fk_m_conversation
    FOREIGN KEY (conversation_id) REFERENCES message_conversations(conversation_id)
    ON DELETE CASCADE
) ENGINE=InnoDB;
