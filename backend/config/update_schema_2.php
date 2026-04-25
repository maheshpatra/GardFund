<?php
require_once __DIR__ . '/database.php';
$db = (new Database())->getConnection();
try {
    $db->exec("ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS aadhaar_no VARCHAR(12) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS pan_number VARCHAR(10) DEFAULT NULL");
    
    // In schema.sql it's is_verified TINYINT(1) DEFAULT 0, but let's check
    
    $db->exec("ALTER TABLE loans 
        ADD COLUMN IF NOT EXISTS disbursement_method ENUM('upi', 'bank_account') DEFAULT 'bank_account'");
        
    echo "Update complete.";
} catch (PDOException $e) {
    echo "Error updating database: " . $e->getMessage() . "\n";
}
