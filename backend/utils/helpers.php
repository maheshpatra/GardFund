<?php
function sendResponse($status, $data, $code = 200) {
    http_response_code($code);
    echo json_encode([
        'status' => $status,
        'data' => $data
    ]);
    exit;
}

function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'status' => 'error',
        'message' => $message
    ]);
    exit;
}

function sendSuccess($data, $message = 'Success', $code = 200) {
    http_response_code($code);
    echo json_encode([
        'status' => 'success',
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

function getRequestBody() {
    return json_decode(file_get_contents("php://input"), true);
}

function generateMemberId($db) {
    $stmt = $db->query("SELECT MAX(CAST(SUBSTRING(member_id, 3) AS UNSIGNED)) as max_id FROM users");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $nextId = ($row['max_id'] ?? 0) + 1;
    return 'GF' . str_pad($nextId, 3, '0', STR_PAD_LEFT);
}

function validateRequired($data, $fields) {
    $missing = [];
    foreach ($fields as $field) {
        if (!isset($data[$field]) || empty(trim($data[$field]))) {
            $missing[] = $field;
        }
    }
    if (!empty($missing)) {
        sendError("Missing required fields: " . implode(', ', $missing));
    }
}

function getFundBalance($db) {
    $stmt = $db->query("SELECT 
        COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN direction = 'debit' THEN amount ELSE 0 END), 0) as balance
        FROM fund_transactions");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return floatval($row['balance']);
}

function addPoints($db, $userId, $points, $action, $description = '') {
    $stmt = $db->prepare("INSERT INTO point_history (user_id, points, action, description) VALUES (?, ?, ?, ?)");
    $stmt->execute([$userId, $points, $action, $description]);
    
    $stmt = $db->prepare("UPDATE users SET total_points = total_points + ? WHERE id = ?");
    $stmt->execute([$points, $userId]);
    
    // Check and update level
    $stmt = $db->prepare("SELECT total_points FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $stmt = $db->prepare("SELECT id FROM levels WHERE min_points <= ? ORDER BY min_points DESC LIMIT 1");
    $stmt->execute([$user['total_points']]);
    $level = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($level) {
        $stmt = $db->prepare("UPDATE users SET level_id = ? WHERE id = ?");
        $stmt->execute([$level['id'], $userId]);
    }
}

function createNotification($db, $userId, $title, $message, $type = 'general', $isGlobal = false, $data = null) {
    $stmt = $db->prepare("INSERT INTO notifications (user_id, title, message, type, is_global, data) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$userId, $title, $message, $type, $isGlobal ? 1 : 0, $data ? json_encode($data) : null]);
}
?>
