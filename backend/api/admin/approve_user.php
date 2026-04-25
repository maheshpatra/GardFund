<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$admin = requireAdmin();
$db = (new Database())->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError("Method not allowed", 405);
}

$data = getRequestBody();
validateRequired($data, ['target_user_id', 'action']);

$userId = $data['target_user_id'];
$action = $data['action'];

if ($action === 'approve') {
    $stmt = $db->prepare("UPDATE users SET is_active = 1, is_verified = 1 WHERE id = ?");
    $stmt->execute([$userId]);
    
    // We try to notify but they can't see until they log in, still good to have when they log in.
    createNotification($db, $userId, 'Account Approved ✅', 'Welcome! Your account has been officially approved by the admin.', 'general');
    
    sendSuccess(null, 'User approved successfully');
} else if ($action === 'reject') {
    // We could delete them or just leave them as is_active=0 but deletion cleans up rejected applications.
    $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    
    sendSuccess(null, 'User application rejected and removed');
} else {
    sendError("Invalid action", 400);
}
?>
