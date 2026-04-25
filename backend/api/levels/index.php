<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = authenticate();
$db = (new Database())->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError("Method not allowed", 405);
}

$stmt = $db->query("SELECT * FROM levels ORDER BY level_number ASC");
$levels = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Get user's current points and level
$stmt = $db->prepare("SELECT total_points, level_id FROM users WHERE id = ?");
$stmt->execute([$user['user_id']]);
$userData = $stmt->fetch(PDO::FETCH_ASSOC);

// Points history
$stmt = $db->prepare("SELECT * FROM point_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20");
$stmt->execute([$user['user_id']]);
$pointHistory = $stmt->fetchAll(PDO::FETCH_ASSOC);

sendSuccess([
    'levels' => $levels,
    'current_points' => (int)$userData['total_points'],
    'current_level_id' => (int)$userData['level_id'],
    'point_history' => $pointHistory
], 'Levels fetched');
?>
