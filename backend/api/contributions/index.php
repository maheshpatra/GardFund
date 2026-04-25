<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = authenticate();
$db = (new Database())->getConnection();

// POST - Make a contribution
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = getRequestBody();
    validateRequired($data, ['amount', 'month_year', 'payment_method']);
    
    // Check if already contributed for this month
    $stmt = $db->prepare("SELECT id FROM contributions WHERE user_id = ? AND month_year = ?");
    $stmt->execute([$user['user_id'], $data['month_year']]);
    if ($stmt->rowCount() > 0) {
        sendError("Contribution for " . $data['month_year'] . " already exists.");
    }
    
    $stmt = $db->prepare("INSERT INTO contributions (user_id, amount, month_year, payment_method, transaction_ref, notes) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $user['user_id'],
        $data['amount'],
        $data['month_year'],
        $data['payment_method'],
        $data['transaction_ref'] ?? null,
        $data['notes'] ?? null
    ]);
    
    $contributionId = $db->lastInsertId();
    
    // Notify admins
    $admins = $db->query("SELECT id FROM users WHERE role IN ('admin', 'treasurer')")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($admins as $admin) {
        createNotification($db, $admin['id'], 'New Contribution', 
            $user['member_id'] . ' submitted a contribution of ₹' . $data['amount'] . ' for ' . $data['month_year'],
            'contribution', false, ['contribution_id' => $contributionId]);
    }
    
    sendSuccess(['contribution_id' => $contributionId], 'Contribution submitted for approval', 201);
}

// GET - Get contribution history
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = isset($_GET['user_id']) ? $_GET['user_id'] : $user['user_id'];
    $year = isset($_GET['year']) ? $_GET['year'] : date('Y');
    
    $stmt = $db->prepare("SELECT c.*, u.full_name as confirmed_by_name FROM contributions c 
        LEFT JOIN users u ON c.confirmed_by = u.id 
        WHERE c.user_id = ? AND c.month_year LIKE ? ORDER BY c.month_year DESC");
    $stmt->execute([$userId, $year . '%']);
    $contributions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get summary
    $stmt = $db->prepare("SELECT 
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COALESCE(SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END), 0) as total_confirmed
        FROM contributions WHERE user_id = ? AND month_year LIKE ?");
    $stmt->execute([$userId, $year . '%']);
    $summary = $stmt->fetch(PDO::FETCH_ASSOC);
    
    sendSuccess([
        'contributions' => $contributions,
        'summary' => $summary,
        'year' => $year
    ], 'Contributions fetched');
}

sendError("Method not allowed", 405);
?>
