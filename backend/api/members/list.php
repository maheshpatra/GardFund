<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = authenticate();
$db = (new Database())->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError("Method not allowed", 405);
}

$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
$search = isset($_GET['search']) ? $_GET['search'] : '';
$offset = ($page - 1) * $limit;

$where = "WHERE u.is_active = 1";
$params = [];

if ($search) {
    $where .= " AND (u.full_name LIKE ? OR u.member_id LIKE ? OR u.phone LIKE ?)";
    $searchParam = "%$search%";
    $params = [$searchParam, $searchParam, $searchParam];
}

$stmt = $db->prepare("SELECT u.id, u.member_id, u.full_name, u.email, u.phone, u.avatar_url, u.occupation, u.role, u.level_id, u.total_points, u.joined_at,
    l.level_name, l.badge_color, l.badge_icon,
    (SELECT COUNT(*) FROM contributions WHERE user_id = u.id AND status = 'confirmed') as contributions_count
    FROM users u LEFT JOIN levels l ON u.level_id = l.id $where ORDER BY u.total_points DESC, u.member_id ASC LIMIT $limit OFFSET $offset");
$stmt->execute($params);
$members = $stmt->fetchAll(PDO::FETCH_ASSOC);

$countStmt = $db->prepare("SELECT COUNT(*) as total FROM users u $where");
$countStmt->execute($params);
$total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

sendSuccess([
    'members' => $members,
    'pagination' => [
        'page' => $page,
        'limit' => $limit,
        'total' => (int)$total,
        'pages' => ceil($total / $limit)
    ]
], 'Members fetched');
?>
