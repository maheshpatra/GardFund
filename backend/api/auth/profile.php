<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = authenticate();
$db = (new Database())->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->prepare("SELECT u.id, u.member_id, u.full_name, u.email, u.phone, u.avatar_url, u.address, u.date_of_birth, u.emergency_contact, u.occupation, u.bank_name, u.account_no, u.ifsc_code, u.upi_id, u.role, u.level_id, u.total_points, u.is_active, u.is_verified, u.joined_at, u.last_login,
        l.level_name, l.level_number, l.badge_color, l.badge_icon, l.max_loan_amount, l.benefits,
        (SELECT COUNT(*) FROM contributions WHERE user_id = u.id AND status = 'confirmed') as total_contributions,
        (SELECT COALESCE(SUM(amount), 0) FROM contributions WHERE user_id = u.id AND status = 'confirmed') as total_contributed,
        (SELECT COUNT(*) FROM loans WHERE user_id = u.id AND status IN ('active', 'completed')) as total_loans
        FROM users u LEFT JOIN levels l ON u.level_id = l.id WHERE u.id = ?");
    $stmt->execute([$user['user_id']]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$profile) {
        sendError("User not found", 404);
    }
    
    // Get next level info
    $stmt = $db->prepare("SELECT * FROM levels WHERE level_number = ? + 1");
    $stmt->execute([$profile['level_number']]);
    $nextLevel = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $profile['next_level'] = $nextLevel;
    
    sendSuccess($profile, 'Profile fetched');
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = getRequestBody();
    
    $allowed = ['full_name', 'phone', 'address', 'date_of_birth', 'emergency_contact', 'occupation', 'avatar_url', 'bank_name', 'account_no', 'ifsc_code', 'upi_id'];
    $updates = [];
    $params = [];
    
    foreach ($allowed as $field) {
        if (isset($data[$field])) {
            $updates[] = "$field = ?";
            $params[] = $data[$field];
        }
    }
    
    if (empty($updates)) {
        sendError("No valid fields to update");
    }
    
    $params[] = $user['user_id'];
    $stmt = $db->prepare("UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?");
    $stmt->execute($params);
    
    sendSuccess(null, 'Profile updated successfully');
}

sendError("Method not allowed", 405);
?>
