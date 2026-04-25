<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$admin = requireAdmin();
$db = (new Database())->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError("Method not allowed", 405);
}

$data = getRequestBody();
validateRequired($data, ['loan_id', 'action']);

$stmt = $db->prepare("SELECT l.*, u.member_id, u.full_name FROM loans l JOIN users u ON l.user_id = u.id WHERE l.id = ? AND l.status = 'pending'");
$stmt->execute([$data['loan_id']]);

if ($stmt->rowCount() === 0) {
    sendError("Pending loan not found.");
}
$loan = $stmt->fetch(PDO::FETCH_ASSOC);

if ($data['action'] === 'approve') {
    // Check fund balance
    $fundBalance = getFundBalance($db);
    if ($loan['amount'] > $fundBalance) {
        sendError("Insufficient fund balance. Available: ₹" . number_format($fundBalance));
    }
    
    $db->beginTransaction();
    try {
        // Update loan status
        $stmt = $db->prepare("UPDATE loans SET status = 'active', approved_by = ?, approved_at = NOW(), admin_notes = ? WHERE id = ?");
        $stmt->execute([$admin['user_id'], $data['notes'] ?? null, $data['loan_id']]);
        
        // Debit from fund
        $newBalance = $fundBalance - $loan['amount'];
        $stmt = $db->prepare("INSERT INTO fund_transactions (transaction_type, amount, direction, reference_id, reference_type, user_id, description, balance_after, created_by) VALUES ('loan_disbursement', ?, 'debit', ?, 'loan', ?, ?, ?, ?)");
        $stmt->execute([
            $loan['amount'], $data['loan_id'], $loan['user_id'],
            ucfirst($loan['loan_type']) . ' loan disbursement to ' . $loan['full_name'],
            $newBalance, $admin['user_id']
        ]);
        
        // Notify member
        createNotification($db, $loan['user_id'], 'Loan Approved! 🎉',
            'Your ' . $loan['loan_type'] . ' loan of ₹' . number_format($loan['amount']) . ' has been approved. EMI: ₹' . number_format($loan['monthly_emi']) . '/month',
            'loan', false, ['loan_id' => $data['loan_id']]);
        
        // Global notification
        createNotification($db, null, 'Fund Update',
            'A loan of ₹' . number_format($loan['amount']) . ' has been disbursed. Fund balance: ₹' . number_format($newBalance),
            'general', true);
        
        $db->commit();
        sendSuccess(null, 'Loan approved and disbursed');
    } catch (Exception $e) {
        $db->rollBack();
        sendError("Failed to approve: " . $e->getMessage(), 500);
    }
} elseif ($data['action'] === 'reject') {
    $stmt = $db->prepare("UPDATE loans SET status = 'rejected', approved_by = ?, admin_notes = ? WHERE id = ?");
    $stmt->execute([$admin['user_id'], $data['notes'] ?? 'Rejected by admin', $data['loan_id']]);
    
    createNotification($db, $loan['user_id'], 'Loan Request Rejected',
        'Your ' . $loan['loan_type'] . ' loan request of ₹' . number_format($loan['amount']) . ' was rejected. Reason: ' . ($data['notes'] ?? 'N/A'),
        'loan');
    
    sendSuccess(null, 'Loan rejected');
} else {
    sendError("Invalid action. Use 'approve' or 'reject'.");
}
?>
