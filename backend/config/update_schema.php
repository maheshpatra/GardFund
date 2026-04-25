<?php
require_once __DIR__ . '/database.php';

$db = (new Database())->getConnection();

try {
    // Add bank details to users table
    $db->exec("ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS account_no VARCHAR(30) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(20) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100) DEFAULT NULL");
    
    // Support emojis in notifications and other tables
    $db->exec("ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $db->exec("ALTER TABLE notifications CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $db->exec("ALTER TABLE loans CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $db->exec("ALTER TABLE loan_repayments CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $db->exec("ALTER TABLE fund_transactions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    
    echo "Tables converted to utf8mb4.\n";
    
    echo "Users table updated.\n";

    // Create settings table
    $db->exec("CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(50) UNIQUE NOT NULL,
        setting_value TEXT DEFAULT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
    
    echo "Settings table created.\n";

    // Insert default settings
    $settings = [
        'qr_code_url' => 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=example',
        'upi_id' => 'fund@upi',
        'fund_bank_details' => 'Fund Bank Details: Name, Acc, IFSC'
    ];

    $stmt = $db->prepare("INSERT IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)");
    foreach ($settings as $key => $value) {
        $stmt->execute([$key, $value]);
    }
    
    echo "Default settings inserted.\n";

} catch (PDOException $e) {
    echo "Error updating database: " . $e->getMessage() . "\n";
}
?>
