<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/jwt_handler.php';
require_once __DIR__ . '/../../utils/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError("Method not allowed", 405);
}

$data = getRequestBody();
validateRequired($data, ['full_name', 'email', 'phone', 'password']);

$db = (new Database())->getConnection();

// Check if email or phone already exists
$stmt = $db->prepare("SELECT id FROM users WHERE email = ? OR phone = ?");
$stmt->execute([$data['email'], $data['phone']]);
if ($stmt->rowCount() > 0) {
    sendError("Email or phone number already registered.");
}

// Check member limit (100 members)
$stmt = $db->query("SELECT COUNT(*) as total FROM users WHERE role = 'member'");
$count = $stmt->fetch(PDO::FETCH_ASSOC);
if ($count['total'] >= 100) {
    sendError("Maximum member limit (100) reached. Contact admin.");
}

$memberId = generateMemberId($db);
$passwordHash = password_hash($data['password'], PASSWORD_BCRYPT);

$stmt = $db->prepare("INSERT INTO users (member_id, full_name, email, phone, password_hash, address, date_of_birth, emergency_contact, occupation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");

$stmt->execute([
    $memberId,
    $data['full_name'],
    $data['email'],
    $data['phone'],
    $passwordHash,
    $data['address'] ?? null,
    $data['date_of_birth'] ?? null,
    $data['emergency_contact'] ?? null,
    $data['occupation'] ?? null
]);

$userId = $db->lastInsertId();

// Generate JWT
$token = JWTHandler::generateToken([
    'user_id' => $userId,
    'member_id' => $memberId,
    'role' => 'member',
    'email' => $data['email']
]);

// Add welcome points
addPoints($db, $userId, 10, 'registration', 'Welcome bonus for joining GardFund');

// Create welcome notification
createNotification($db, $userId, 'Welcome to GardFund! 🎉', 'Welcome aboard! Your member ID is ' . $memberId . '. Start your journey by making your first contribution.', 'general');

sendSuccess([
    'token' => $token,
    'user' => [
        'id' => $userId,
        'member_id' => $memberId,
        'full_name' => $data['full_name'],
        'email' => $data['email'],
        'phone' => $data['phone'],
        'role' => 'member',
        'level_id' => 1,
        'total_points' => 10
    ]
], 'Registration successful', 201);
?>
