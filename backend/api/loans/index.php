<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = authenticate();
$db = (new Database())->getConnection();

// POST - Request a loan
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = getRequestBody();
    validateRequired($data, ['loan_type', 'amount', 'purpose', 'repayment_months', 'disbursement_method']);
    
    // Check user level and max loan amount
    $stmt = $db->prepare("SELECT u.level_id, l.max_loan_amount, l.level_name FROM users u JOIN levels l ON u.level_id = l.id WHERE u.id = ?");
    $stmt->execute([$user['user_id']]);
    $userLevel = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($data['amount'] > $userLevel['max_loan_amount']) {
        sendError("Loan amount exceeds your level limit. Your " . $userLevel['level_name'] . " level allows up to ₹" . number_format($userLevel['max_loan_amount']));
    }
    
    // Check for existing active loans
    $stmt = $db->prepare("SELECT COUNT(*) as active_loans FROM loans WHERE user_id = ? AND status IN ('active', 'approved', 'pending')");
    $stmt->execute([$user['user_id']]);
    $active = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($active['active_loans'] >= 2) {
        sendError("You already have active/pending loans. Please complete them first.");
    }
    
    // Check fund balance
    $fundBalance = getFundBalance($db);
    if ($data['amount'] > $fundBalance * 0.3) {
        sendError("Requested amount exceeds 30% of fund balance. Please request a smaller amount.");
    }
    
    $monthlyEmi = round($data['amount'] / $data['repayment_months'], 2);
    $dueDate = date('Y-m-d', strtotime('+' . $data['repayment_months'] . ' months'));
    
    $stmt = $db->prepare("INSERT INTO loans (user_id, loan_type, amount, purpose, repayment_months, monthly_emi, remaining_amount, due_date, guarantor_id, documents, disbursement_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $user['user_id'],
        $data['loan_type'],
        $data['amount'],
        $data['purpose'],
        $data['repayment_months'],
        $monthlyEmi,
        $data['amount'],
        $dueDate,
        $data['guarantor_id'] ?? null,
        $data['documents'] ?? null,
        $data['disbursement_method']
    ]);
    
    $loanId = $db->lastInsertId();
    
    // Notify admins
    $admins = $db->query("SELECT id FROM users WHERE role IN ('admin', 'treasurer')")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($admins as $admin) {
        createNotification($db, $admin['id'], 'New Loan Request 🔔', 
            $user['member_id'] . ' requested a ' . $data['loan_type'] . ' loan of ₹' . number_format($data['amount']),
            'loan', false, ['loan_id' => $loanId]);
    }
    
    sendSuccess(['loan_id' => $loanId, 'monthly_emi' => $monthlyEmi, 'due_date' => $dueDate], 'Loan request submitted', 201);
}

// GET - Get loans
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = isset($_GET['user_id']) ? $_GET['user_id'] : $user['user_id'];
    $status = isset($_GET['status']) ? $_GET['status'] : null;
    
    $where = "WHERE l.user_id = ?";
    $params = [$userId];
    
    if ($status) {
        $where .= " AND l.status = ?";
        $params[] = $status;
    }
    
    $stmt = $db->prepare("SELECT l.*, u.full_name as approved_by_name, g.full_name as guarantor_name
        FROM loans l 
        LEFT JOIN users u ON l.approved_by = u.id 
        LEFT JOIN users g ON l.guarantor_id = g.id
        $where ORDER BY l.requested_at DESC");
    $stmt->execute($params);
    $loans = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Enrich with repayment info
    foreach ($loans as &$loan) {
        $stmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as total_repaid FROM loan_repayments WHERE loan_id = ? AND status = 'confirmed'");
        $stmt->execute([$loan['id']]);
        $repaid = $stmt->fetch(PDO::FETCH_ASSOC);
        $loan['total_repaid'] = floatval($repaid['total_repaid']);
        $loan['remaining_amount'] = floatval($loan['amount']) - $loan['total_repaid'];
        $loan['progress'] = $loan['amount'] > 0 ? round(($loan['total_repaid'] / $loan['amount']) * 100, 1) : 0;
    }
    
    sendSuccess(['loans' => $loans], 'Loans fetched');
}

sendError("Method not allowed", 405);
?>
