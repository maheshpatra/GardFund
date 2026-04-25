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
validateRequired($data, ['contribution_id', 'action']);

$stmt = $db->prepare("SELECT c.*, u.member_id, u.full_name FROM contributions c JOIN users u ON c.user_id = u.id WHERE c.id = ? AND c.status = 'pending'");
$stmt->execute([$data['contribution_id']]);

if ($stmt->rowCount() === 0) {
    sendError("Pending contribution not found.");
}
$contribution = $stmt->fetch(PDO::FETCH_ASSOC);

if ($data['action'] === 'approve') {
    $db->beginTransaction();
    try {
        // Update contribution
        $stmt = $db->prepare("UPDATE contributions SET status = 'confirmed', confirmed_by = ?, confirmed_at = NOW() WHERE id = ?");
        $stmt->execute([$admin['user_id'], $data['contribution_id']]);
        
        // Add fund transaction
        $balance = getFundBalance($db);
        $newBalance = $balance + $contribution['amount'];
        $stmt = $db->prepare("INSERT INTO fund_transactions (transaction_type, amount, direction, reference_id, reference_type, user_id, description, balance_after, created_by) VALUES ('contribution', ?, 'credit', ?, 'contribution', ?, ?, ?, ?)");
        $stmt->execute([
            $contribution['amount'], $data['contribution_id'], $contribution['user_id'],
            'Monthly contribution for ' . $contribution['month_year'],
            $newBalance, $admin['user_id']
        ]);
        
        // Award points (10 points per on-time contribution)
        addPoints($db, $contribution['user_id'], 10, 'contribution', 'Contribution for ' . $contribution['month_year']);
        
        // Notify member
        createNotification($db, $contribution['user_id'], 'Contribution Approved ✅',
            'Your contribution of ₹' . number_format($contribution['amount']) . ' for ' . $contribution['month_year'] . ' has been approved.',
            'contribution');
        
        $db->commit();
        sendSuccess(null, 'Contribution approved successfully');
    } catch (Exception $e) {
        $db->rollBack();
        sendError("Failed to approve: " . $e->getMessage(), 500);
    }
} elseif ($data['action'] === 'reject') {
    $stmt = $db->prepare("UPDATE contributions SET status = 'rejected', confirmed_by = ?, confirmed_at = NOW() WHERE id = ?");
    $stmt->execute([$admin['user_id'], $data['contribution_id']]);
    
    createNotification($db, $contribution['user_id'], 'Contribution Rejected ❌',
        'Your contribution for ' . $contribution['month_year'] . ' was rejected. Reason: ' . ($data['reason'] ?? 'N/A'),
        'contribution');
    
    sendSuccess(null, 'Contribution rejected');
} else {
    sendError("Invalid action. Use 'approve' or 'reject'.");
}
?>
