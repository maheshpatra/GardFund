<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = authenticate();
$db = (new Database())->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError("Method not allowed", 405);
}

$search = isset($_GET['search']) ? $_GET['search'] : '';
$type = isset($_GET['type']) ? $_GET['type'] : '';
$city = isset($_GET['city']) ? $_GET['city'] : '';

$where = "WHERE 1=1";
$params = [];

if ($search) {
    $where .= " AND (name LIKE ? OR city LIKE ? OR specialities LIKE ?)";
    $s = "%$search%";
    $params = array_merge($params, [$s, $s, $s]);
}
if ($type) {
    $where .= " AND type = ?";
    $params[] = $type;
}
if ($city) {
    $where .= " AND city LIKE ?";
    $params[] = "%$city%";
}

$stmt = $db->prepare("SELECT * FROM hospitals $where ORDER BY is_partnered DESC, rating DESC");
$stmt->execute($params);
$hospitals = $stmt->fetchAll(PDO::FETCH_ASSOC);

sendSuccess(['hospitals' => $hospitals], 'Hospitals fetched');
?>
