<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = authenticate();
$db = (new Database())->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError("Method not allowed", 405);
}

$data = getRequestBody();
validateRequired($data, ['loan_id', 'amount', 'payment_method']);

// Verify loan belongs to user
$stmt = $db->prepare("SELECT * FROM loans WHERE id = ? AND user_id = ? AND status = 'active'");
$stmt->execute([$data['loan_id'], $user['user_id']]);
if ($stmt->rowCount() === 0) {
    sendError("Active loan not found.");
}
$loan = $stmt->fetch(PDO::FETCH_ASSOC);

// Check remaining amount
$stmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as repaid FROM loan_repayments WHERE loan_id = ? AND status IN ('confirmed', 'pending')");
$stmt->execute([$data['loan_id']]);
$repaid = $stmt->fetch(PDO::FETCH_ASSOC);
$remaining = floatval($loan['amount']) - floatval($repaid['repaid']);

if ($data['amount'] > $remaining) {
    sendError("Payment amount exceeds remaining balance of ₹" . number_format($remaining, 2));
}

$stmt = $db->prepare("INSERT INTO loan_repayments (loan_id, user_id, amount, payment_method, transaction_ref, notes) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->execute([
    $data['loan_id'],
    $user['user_id'],
    $data['amount'],
    $data['payment_method'],
    $data['transaction_ref'] ?? null,
    $data['notes'] ?? null
]);

// Notify admins
$admins = $db->query("SELECT id FROM users WHERE role IN ('admin', 'treasurer')")->fetchAll(PDO::FETCH_ASSOC);
foreach ($admins as $admin) {
    createNotification(
        $db,
        $admin['id'],
        'Loan Repayment',
        $user['member_id'] . ' made a repayment of ₹' . number_format($data['amount']) . ' for loan #' . $data['loan_id'],
        'loan'
    );
}

sendSuccess(null, 'Repayment submitted for approval', 201);
?>