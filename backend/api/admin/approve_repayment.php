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
validateRequired($data, ['repayment_id', 'action']);

$stmt = $db->prepare("SELECT lr.*, l.user_id as borrower_id, l.amount as loan_amount, l.loan_type, u.member_id, u.full_name 
    FROM loan_repayments lr 
    JOIN loans l ON lr.loan_id = l.id 
    JOIN users u ON lr.user_id = u.id 
    WHERE lr.id = ? AND lr.status = 'pending'");
$stmt->execute([$data['repayment_id']]);

if ($stmt->rowCount() === 0) {
    sendError("Pending repayment not found.");
}
$repayment = $stmt->fetch(PDO::FETCH_ASSOC);

if ($data['action'] === 'approve') {
    $db->beginTransaction();
    try {
        // Update repayment
        $stmt = $db->prepare("UPDATE loan_repayments SET status = 'confirmed', confirmed_by = ?, confirmed_at = NOW() WHERE id = ?");
        $stmt->execute([$admin['user_id'], $data['repayment_id']]);
        
        // Update loan total_repaid
        $stmt = $db->prepare("UPDATE loans SET total_repaid = total_repaid + ? WHERE id = ?");
        $stmt->execute([$repayment['amount'], $repayment['loan_id']]);
        
        // Add fund transaction (credit)
        $balance = getFundBalance($db);
        $newBalance = $balance + $repayment['amount'];
        $stmt = $db->prepare("INSERT INTO fund_transactions (transaction_type, amount, direction, reference_id, reference_type, user_id, description, balance_after, created_by) VALUES ('loan_repayment', ?, 'credit', ?, 'loan_repayment', ?, ?, ?, ?)");
        $stmt->execute([
            $repayment['amount'], $repayment['loan_id'], $repayment['borrower_id'],
            'Loan repayment from ' . $repayment['full_name'],
            $newBalance, $admin['user_id']
        ]);
        
        // Check if loan is fully repaid
        $stmt = $db->prepare("SELECT amount, total_repaid FROM loans WHERE id = ?");
        $stmt->execute([$repayment['loan_id']]);
        $loan = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($loan['total_repaid'] >= $loan['amount']) {
            $stmt = $db->prepare("UPDATE loans SET status = 'completed', remaining_amount = 0, completed_at = NOW() WHERE id = ?");
            $stmt->execute([$repayment['loan_id']]);
            
            // Bonus points for completing loan on time
            addPoints($db, $repayment['borrower_id'], 25, 'loan_completed', 'Loan fully repaid');
            
            createNotification($db, $repayment['borrower_id'], 'Loan Completed! 🎊',
                'Congratulations! Your loan has been fully repaid. You earned 25 bonus points!',
                'reward');
        } else {
            // Points for repayment
            addPoints($db, $repayment['borrower_id'], 5, 'loan_repayment', 'Loan repayment');
            
            $remaining = $loan['amount'] - $loan['total_repaid'];
            $stmt = $db->prepare("UPDATE loans SET remaining_amount = ? WHERE id = ?");
            $stmt->execute([$remaining, $repayment['loan_id']]);
        }
        
        createNotification($db, $repayment['borrower_id'], 'Repayment Confirmed ✅',
            'Your repayment of ₹' . number_format($repayment['amount']) . ' has been confirmed.',
            'loan');
        
        $db->commit();
        sendSuccess(null, 'Repayment approved');
    } catch (Exception $e) {
        $db->rollBack();
        sendError("Failed: " . $e->getMessage(), 500);
    }
} elseif ($data['action'] === 'reject') {
    $stmt = $db->prepare("UPDATE loan_repayments SET status = 'rejected', confirmed_by = ? WHERE id = ?");
    $stmt->execute([$admin['user_id'], $data['repayment_id']]);
    
    createNotification($db, $repayment['borrower_id'], 'Repayment Rejected',
        'Your repayment of ₹' . number_format($repayment['amount']) . ' was rejected.',
        'loan');
    
    sendSuccess(null, 'Repayment rejected');
}
?>
