<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../utils/helpers.php';

$user = authenticate();
$db = (new Database())->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError("Method not allowed", 405);
}

if (!isset($_FILES['avatar'])) {
    sendError("No file uploaded");
}

$file = $_FILES['avatar'];
$allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
$maxSize = 2 * 1024 * 1024; // 2MB

if (!in_array($file['type'], $allowedTypes)) {
    sendError("Invalid file type. Only JPG, PNG, WEBP allowed.");
}

if ($file['size'] > $maxSize) {
    sendError("File size exceeds 2MB limit.");
}

$uploadDir = __DIR__ . '/../../uploads/avatars/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = 'avatar_' . $user['user_id'] . '_' . time() . '.' . $extension;
$targetPath = $uploadDir . $filename;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    // Get old avatar to delete
    $stmt = $db->prepare("SELECT avatar_url FROM users WHERE id = ?");
    $stmt->execute([$user['user_id']]);
    $oldUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($oldUser && $oldUser['avatar_url']) {
        // Remove leading slash if present
        $oldPathPart = ltrim($oldUser['avatar_url'], '/');
        $oldPath = __DIR__ . '/../../' . $oldPathPart;
        if (file_exists($oldPath) && is_file($oldPath)) {
            unlink($oldPath);
        }
    }

    $avatarUrl = '/uploads/avatars/' . $filename;
    
    // Update user record
    $stmt = $db->prepare("UPDATE users SET avatar_url = ? WHERE id = ?");
    $stmt->execute([$avatarUrl, $user['user_id']]);
    
    sendSuccess(['avatar_url' => $avatarUrl], 'Avatar uploaded successfully');
} else {
    sendError("Failed to save file.");
}
?>
