
CREATE DATABASE IF NOT EXISTS fault_diagnosis;
USE fault_diagnosis;


CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO users (username, password) VALUES ('Abhishek', 'Abhishek');
INSERT INTO users (username, password) VALUES ('Akshat', 'Akshat');


SELECT * FROM users;
