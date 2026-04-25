<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/jwt_handler.php';
require_once __DIR__ . '/../../utils/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError("Method not allowed", 405);
}

$data = getRequestBody();
validateRequired($data, ['email', 'password']);

$db = (new Database())->getConnection();

$stmt = $db->prepare("SELECT u.*, l.level_name, l.badge_color, l.badge_icon FROM users u LEFT JOIN levels l ON u.level_id = l.id WHERE u.email = ?");
$stmt->execute([$data['email']]);

if ($stmt->rowCount() === 0) {
    sendError("Invalid email or password.", 401);
}

$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!password_verify($data['password'], $user['password_hash'])) {
    sendError("Invalid email or password.", 401);
}

if (!$user['is_active']) {
    sendError("Account has been deactivated. Contact admin.", 403);
}

// Update last login
$stmt = $db->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
$stmt->execute([$user['id']]);

// Generate JWT
$token = JWTHandler::generateToken([
    'user_id' => $user['id'],
    'member_id' => $user['member_id'],
    'role' => $user['role'],
    'email' => $user['email']
]);

sendSuccess([
    'token' => $token,
    'user' => [
        'id' => $user['id'],
        'member_id' => $user['member_id'],
        'full_name' => $user['full_name'],
        'email' => $user['email'],
        'phone' => $user['phone'],
        'role' => $user['role'],
        'level_id' => $user['level_id'],
        'level_name' => $user['level_name'],
        'badge_color' => $user['badge_color'],
        'badge_icon' => $user['badge_icon'],
        'total_points' => $user['total_points'],
        'avatar_url' => $user['avatar_url'],
        'is_verified' => $user['is_verified'],
        'joined_at' => $user['joined_at']
    ]
], 'Login successful');
?>
