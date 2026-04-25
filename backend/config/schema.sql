-- GardFund Database Schema
-- Group Fund Management System

CREATE DATABASE IF NOT EXISTS gardfund_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gardfund_db;

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id VARCHAR(10) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    date_of_birth DATE DEFAULT NULL,
    emergency_contact VARCHAR(15) DEFAULT NULL,
    occupation VARCHAR(100) DEFAULT NULL,
    role ENUM('member', 'admin', 'treasurer') DEFAULT 'member',
    level_id INT DEFAULT 1,
    total_points INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    is_verified TINYINT(1) DEFAULT 0,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    bank_name VARCHAR(100) DEFAULT NULL,
    account_no VARCHAR(30) DEFAULT NULL,
    ifsc_code VARCHAR(20) DEFAULT NULL,
    upi_id VARCHAR(100) DEFAULT NULL,
    aadhaar_no VARCHAR(12) DEFAULT NULL,
    pan_number VARCHAR(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- LEVELS TABLE (Level-Up Program)
-- =============================================
CREATE TABLE IF NOT EXISTS levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    level_name VARCHAR(50) NOT NULL,
    level_number INT NOT NULL,
    min_points INT NOT NULL DEFAULT 0,
    max_loan_amount DECIMAL(12,2) DEFAULT 0,
    badge_color VARCHAR(20) DEFAULT '#4F46E5',
    badge_icon VARCHAR(50) DEFAULT 'star',
    benefits TEXT DEFAULT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CONTRIBUTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS contributions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
    month_year VARCHAR(7) NOT NULL, -- Format: 2024-01
    payment_method ENUM('cash', 'upi', 'bank_transfer', 'other') DEFAULT 'cash',
    transaction_ref VARCHAR(100) DEFAULT NULL,
    status ENUM('pending', 'confirmed', 'rejected') DEFAULT 'pending',
    confirmed_by INT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_contribution (user_id, month_year)
);

-- =============================================
-- LOANS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS loans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    loan_type ENUM('emergency', 'small', 'medical') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    interest_rate DECIMAL(5,2) DEFAULT 0.00,
    purpose TEXT NOT NULL,
    repayment_months INT NOT NULL DEFAULT 6,
    monthly_emi DECIMAL(12,2) DEFAULT 0,
    total_repaid DECIMAL(12,2) DEFAULT 0,
    remaining_amount DECIMAL(12,2) DEFAULT 0,
    disbursement_method ENUM('upi', 'bank_account') DEFAULT 'bank_account',
    status ENUM('pending', 'approved', 'rejected', 'active', 'completed', 'overdue') DEFAULT 'pending',
    approved_by INT DEFAULT NULL,
    guarantor_id INT DEFAULT NULL,
    due_date DATE NOT NULL,
    documents TEXT DEFAULT NULL,
    admin_notes TEXT DEFAULT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (guarantor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- LOAN REPAYMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS loan_repayments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id INT NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('cash', 'upi', 'bank_transfer', 'other') DEFAULT 'cash',
    transaction_ref VARCHAR(100) DEFAULT NULL,
    status ENUM('pending', 'confirmed', 'rejected') DEFAULT 'pending',
    confirmed_by INT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- FUND TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS fund_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_type ENUM('contribution', 'loan_disbursement', 'loan_repayment', 'expense', 'interest', 'penalty', 'other') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    direction ENUM('credit', 'debit') NOT NULL,
    reference_id INT DEFAULT NULL,
    reference_type VARCHAR(50) DEFAULT NULL,
    user_id INT DEFAULT NULL,
    description TEXT DEFAULT NULL,
    balance_after DECIMAL(15,2) DEFAULT 0,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- HOSPITALS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS hospitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) DEFAULT NULL,
    pincode VARCHAR(10) DEFAULT NULL,
    phone VARCHAR(15) DEFAULT NULL,
    emergency_phone VARCHAR(15) DEFAULT NULL,
    email VARCHAR(100) DEFAULT NULL,
    website VARCHAR(200) DEFAULT NULL,
    specialities TEXT DEFAULT NULL,
    type ENUM('government', 'private', 'charitable') DEFAULT 'private',
    has_emergency TINYINT(1) DEFAULT 1,
    has_ambulance TINYINT(1) DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0,
    latitude DECIMAL(10,8) DEFAULT NULL,
    longitude DECIMAL(11,8) DEFAULT NULL,
    is_partnered TINYINT(1) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('contribution', 'loan', 'general', 'alert', 'reward', 'reminder') DEFAULT 'general',
    is_read TINYINT(1) DEFAULT 0,
    is_global TINYINT(1) DEFAULT 0,
    data JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value TEXT DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- POINT HISTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS point_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    points INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- INSERT DEFAULT LEVELS
-- =============================================
INSERT INTO levels (level_name, level_number, min_points, max_loan_amount, badge_color, badge_icon, benefits, description) VALUES
('Bronze', 1, 0, 5000.00, '#CD7F32', 'shield-outline', 'Basic fund access', 'Starting level for all new members'),
('Silver', 2, 100, 15000.00, '#C0C0C0', 'shield-half-full', 'Priority loan processing, +5000 loan limit', 'Consistent contributors with good standing'),
('Gold', 3, 300, 30000.00, '#FFD700', 'shield', 'Fast-track loans, Higher limits, Medical benefits', 'Exemplary members with excellent track record'),
('Platinum', 4, 600, 50000.00, '#E5E4E2', 'trophy', 'Maximum loan limit, Emergency priority, VIP benefits', 'Top-tier members with outstanding contribution history'),
('Diamond', 5, 1000, 100000.00, '#B9F2FF', 'diamond', 'Unlimited benefits, Advisory board eligibility', 'Elite members who have significantly contributed to the fund');

-- =============================================
-- INSERT SAMPLE HOSPITALS
-- =============================================
INSERT INTO hospitals (name, address, city, state, pincode, phone, emergency_phone, type, has_emergency, has_ambulance, rating, specialities, is_partnered, discount_percentage) VALUES
('Apollo Hospital', 'Jubilee Hills, Road No. 72', 'Hyderabad', 'Telangana', '500033', '040-23607777', '040-23607000', 'private', 1, 1, 4.5, 'Cardiology, Neurology, Orthopedics, Emergency', 1, 10.00),
('AIIMS', 'Ansari Nagar, New Delhi', 'New Delhi', 'Delhi', '110029', '011-26588500', '011-26588700', 'government', 1, 1, 4.7, 'All Specialities', 0, 0.00),
('Fortis Hospital', 'Bannerghatta Road', 'Bangalore', 'Karnataka', '560076', '080-66214444', '080-66214000', 'private', 1, 1, 4.3, 'Cardiology, Oncology, Transplant', 1, 8.00),
('Max Super Speciality', 'Saket, New Delhi', 'New Delhi', 'Delhi', '110017', '011-26515050', '011-26515000', 'private', 1, 1, 4.4, 'Cardiac Sciences, Neurosciences, Liver Transplant', 1, 12.00),
('Government General Hospital', 'Park Town', 'Chennai', 'Tamil Nadu', '600003', '044-25305000', '044-25305100', 'government', 1, 1, 3.8, 'General Medicine, Surgery, Emergency', 0, 0.00),
('Medanta - The Medicity', 'Sector 38', 'Gurugram', 'Haryana', '122001', '0124-4141414', '0124-4141000', 'private', 1, 1, 4.6, 'Heart Institute, Neurosciences, Cancer', 1, 15.00),
('Narayana Health', 'Hosur Road, Bommasandra', 'Bangalore', 'Karnataka', '560099', '080-71222222', '080-71222000', 'private', 1, 1, 4.2, 'Cardiac Surgery, Nephrology, Organ Transplant', 1, 10.00),
('KIMS Hospital', 'Minister Road, Secunderabad', 'Hyderabad', 'Telangana', '500003', '040-44885000', '040-44885100', 'private', 1, 1, 4.1, 'Cardiology, Gastroenterology, Pulmonology', 1, 7.00);

-- =============================================
-- INSERT DEFAULT ADMIN USER (password: Admin@123)
-- =============================================
INSERT INTO users (member_id, full_name, email, phone, password_hash, role, is_verified, level_id, total_points) VALUES
('GF001', 'Admin User', 'admin@gardfund.com', '9999999999', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1, 5, 1000);

-- =============================================
-- DEFAULT SETTINGS
-- =============================================
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES 
('qr_code_url', 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=example'),
('upi_id', 'fund@upi'),
('fund_bank_details', 'Fund Bank Details: Name, Acc, IFSC');
