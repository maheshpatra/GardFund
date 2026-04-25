<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../utils/helpers.php';

$user = authenticate();
$db = (new Database())->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->query("SELECT setting_key, setting_value FROM settings");
    $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    // Ensure all keys exist even if empty
    $defaults = [
        'qr_code_url' => '',
        'upi_id' => '',
        'fund_bank_details' => ''
    ];
    
    $settings = array_merge($defaults, $settings);
    
    sendSuccess($settings, 'Settings fetched');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($user['role'] !== 'admin') {
        sendError("Unauthorized access", 403);
    }
    
    $data = getRequestBody();
    $db->beginTransaction();
    
    try {
        $stmt = $db->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
        
        foreach ($data as $key => $value) {
            // Only allow specific keys
            if (in_array($key, ['qr_code_url', 'upi_id', 'fund_bank_details'])) {
                $stmt->execute([$key, $value]);
            }
        }
        
        $db->commit();
        sendSuccess(null, 'Settings updated successfully');
    } catch (Exception $e) {
        $db->rollBack();
        sendError("Error updating settings: " . $e->getMessage());
    }
}

sendError("Method not allowed", 405);
?>
