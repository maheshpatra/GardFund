<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$admin = requireAdmin();
$db = (new Database())->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError("Method not allowed", 405);
}

// Pending contributions
$stmt = $db->query("SELECT c.*, u.full_name, u.member_id FROM contributions c JOIN users u ON c.user_id = u.id WHERE c.status = 'pending' ORDER BY c.paid_at DESC");
$pendingContributions = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Pending loans
$stmt = $db->query("SELECT l.*, u.full_name, u.member_id FROM loans l JOIN users u ON l.user_id = u.id WHERE l.status = 'pending' ORDER BY l.requested_at DESC");
$pendingLoans = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Pending repayments
$stmt = $db->query("SELECT lr.*, u.full_name, u.member_id, l.loan_type, l.amount as loan_amount FROM loan_repayments lr JOIN users u ON lr.user_id = u.id JOIN loans l ON lr.loan_id = l.id WHERE lr.status = 'pending' ORDER BY lr.paid_at DESC");
$pendingRepayments = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Overdue loans
$stmt = $db->query("SELECT l.*, u.full_name, u.member_id, u.phone FROM loans l JOIN users u ON l.user_id = u.id WHERE l.status = 'active' AND l.due_date < CURDATE() ORDER BY l.due_date ASC");
$overdueLoans = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Defaulters - members who haven't paid this month
$currentMonth = date('Y-m');
$stmt = $db->prepare("SELECT u.id, u.member_id, u.full_name, u.phone, u.level_id, l.level_name
    FROM users u LEFT JOIN levels l ON u.level_id = l.id
    WHERE u.role = 'member' AND u.is_active = 1 
    AND u.id NOT IN (SELECT user_id FROM contributions WHERE month_year = ? AND status IN ('confirmed', 'pending'))
    ORDER BY u.member_id ASC");
$stmt->execute([$currentMonth]);
$defaulters = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Stats summary
$stats = [
    'pending_contributions' => count($pendingContributions),
    'pending_loans' => count($pendingLoans),
    'pending_repayments' => count($pendingRepayments),
    'overdue_loans' => count($overdueLoans),
    'defaulters' => count($defaulters)
];

sendSuccess([
    'stats' => $stats,
    'pending_contributions' => $pendingContributions,
    'pending_loans' => $pendingLoans,
    'pending_repayments' => $pendingRepayments,
    'overdue_loans' => $overdueLoans,
    'defaulters' => $defaulters
], 'Admin dashboard fetched');
?>
