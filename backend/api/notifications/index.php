<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = authenticate();
$db = (new Database())->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $unreadOnly = isset($_GET['unread']) && $_GET['unread'] == '1';
    
    $where = "(n.user_id = ? OR n.is_global = 1)";
    $params = [$user['user_id']];
    
    if ($unreadOnly) {
        $where .= " AND n.is_read = 0";
    }
    
    $stmt = $db->prepare("SELECT * FROM notifications n WHERE $where ORDER BY created_at DESC LIMIT 50");
    $stmt->execute($params);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Unread count
    $stmt = $db->prepare("SELECT COUNT(*) as unread FROM notifications WHERE (user_id = ? OR is_global = 1) AND is_read = 0");
    $stmt->execute([$user['user_id']]);
    $unread = $stmt->fetch(PDO::FETCH_ASSOC)['unread'];
    
    sendSuccess([
        'notifications' => $notifications,
        'unread_count' => (int)$unread
    ], 'Notifications fetched');
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = getRequestBody();
    
    if (isset($data['mark_all_read']) && $data['mark_all_read']) {
        $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE (user_id = ? OR is_global = 1) AND is_read = 0");
        $stmt->execute([$user['user_id']]);
    } elseif (isset($data['notification_id'])) {
        $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND (user_id = ? OR is_global = 1)");
        $stmt->execute([$data['notification_id'], $user['user_id']]);
    }
    
    sendSuccess(null, 'Notifications updated');
}

sendError("Method not allowed", 405);
?>
