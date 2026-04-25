<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = authenticate();
$db = (new Database())->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError("Method not allowed", 405);
}

// Fund balance
$balance = getFundBalance($db);

// Total contributions
$stmt = $db->query("SELECT COALESCE(SUM(amount), 0) as total FROM contributions WHERE status = 'confirmed'");
$totalContributions = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Active loans total
$stmt = $db->query("SELECT COALESCE(SUM(remaining_amount), 0) as total FROM loans WHERE status = 'active'");
$activeLoans = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// Member count
$stmt = $db->query("SELECT COUNT(*) as total FROM users WHERE is_active = 1 AND role = 'member'");
$memberCount = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

// This month collection
$currentMonth = date('Y-m');
$stmt = $db->prepare("SELECT 
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as paid,
    COUNT(DISTINCT user_id) as total_paying
    FROM contributions WHERE month_year = ?");
$stmt->execute([$currentMonth]);
$monthlyStats = $stmt->fetch(PDO::FETCH_ASSOC);

// Recent transactions
$stmt = $db->query("SELECT ft.*, u.full_name, u.member_id FROM fund_transactions ft 
    LEFT JOIN users u ON ft.user_id = u.id 
    ORDER BY ft.created_at DESC LIMIT 10");
$recentTransactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Monthly trend (last 6 months)
$stmt = $db->query("SELECT month_year, 
    COUNT(*) as count, 
    SUM(amount) as total 
    FROM contributions WHERE status = 'confirmed' 
    GROUP BY month_year ORDER BY month_year DESC LIMIT 6");
$monthlyTrend = $stmt->fetchAll(PDO::FETCH_ASSOC);

sendSuccess([
    'fund_balance' => floatval($balance),
    'total_contributions' => floatval($totalContributions),
    'active_loans_total' => floatval($activeLoans),
    'member_count' => (int)$memberCount,
    'max_members' => 100,
    'monthly_collection' => [
        'month' => $currentMonth,
        'paid_count' => (int)$monthlyStats['paid'],
        'total_members' => (int)$memberCount,
        'collection_rate' => $memberCount > 0 ? round(($monthlyStats['paid'] / $memberCount) * 100, 1) : 0
    ],
    'recent_transactions' => $recentTransactions,
    'monthly_trend' => $monthlyTrend
], 'Fund dashboard fetched');
?>
