-- EventWise Database Setup Script for Clever Cloud
-- Copy and paste this entire script into PHPMyAdmin SQL tab

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS expense;
DROP TABLE IF EXISTS profile;
DROP TABLE IF EXISTS event;
DROP TABLE IF EXISTS user;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Create users table
CREATE TABLE user (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create events table
CREATE TABLE event (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  description VARCHAR(255),
  end_date VARCHAR(255),
  location VARCHAR(255),
  name VARCHAR(255),
  start_date VARCHAR(255),
  total_budget DOUBLE,
  user_id BIGINT,
  INDEX user_idx (user_id),
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- Create expenses table
CREATE TABLE expense (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  event_id BIGINT,
  expense_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX event_idx (event_id),
  FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE CASCADE
);

-- Create profiles table
CREATE TABLE profile (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT,
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  bio TEXT,
  date_of_birth DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- Insert sample users
INSERT INTO user (email, password, full_name) VALUES 
('admin@eventwise.com', 'admin123', 'Admin User'),
('user@eventwise.com', 'user123', 'Demo User'),
('john@example.com', 'password123', 'John Doe'),
('jane@example.com', 'password123', 'Jane Smith');

-- Insert sample events
INSERT INTO event (name, description, location, start_date, end_date, total_budget, user_id) VALUES 
('Sample Wedding', 'Beautiful wedding ceremony', 'Grand Hotel Colombo', '2025-09-15', '2025-09-15', 150000.00, 1),
('Birthday Party', '25th Birthday celebration', 'Private Villa', '2025-10-10', '2025-10-10', 50000.00, 2),
('Tech Conference 2025', 'Annual technology summit', 'Convention Center', '2025-11-15', '2025-11-17', 100000.00, 1),
('Marketing Workshop', 'Digital marketing training', 'Business Hub', '2025-12-05', '2025-12-06', 35000.00, 2);

-- Insert sample expenses
INSERT INTO expense (name, amount, event_id) VALUES 
('Venue Rental', 75000.00, 1),
('Catering', 50000.00, 1),
('Photography', 25000.00, 1),
('Venue Rental', 20000.00, 2),
('Catering', 15000.00, 2),
('Decorations', 10000.00, 2),
('Hall Booking', 40000.00, 3),
('Sound System', 15000.00, 3),
('Training Materials', 10000.00, 4),
('Refreshments', 8000.00, 4);

-- Insert sample profiles
INSERT INTO profile (user_id, phone, address, city, country, bio) VALUES 
(1, '+94 77 123 4567', '123 Main Street', 'Colombo', 'Sri Lanka', 'Event planning professional'),
(2, '+94 71 987 6543', '456 Oak Avenue', 'Kandy', 'Sri Lanka', 'Event enthusiast'),
(3, '+94 76 555 1234', '789 Park Road', 'Galle', 'Sri Lanka', 'Wedding coordinator'),
(4, '+94 75 444 9876', '321 Beach Lane', 'Negombo', 'Sri Lanka', 'Corporate event manager');
