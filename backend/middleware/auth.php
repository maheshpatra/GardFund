<?php
require_once __DIR__ . '/../utils/jwt_handler.php';
require_once __DIR__ . '/../utils/helpers.php';

function authenticate() {
    $token = JWTHandler::getTokenFromHeader();
    
    if (!$token) {
        sendError("Access denied. No token provided.", 401);
    }
    
    $decoded = JWTHandler::validateToken($token);
    
    if (!$decoded) {
        sendError("Invalid or expired token.", 401);
    }
    
    return $decoded;
}

function requireAdmin() {
    $user = authenticate();
    if ($user['role'] !== 'admin' && $user['role'] !== 'treasurer') {
        sendError("Access denied. Admin privileges required.", 403);
    }
    return $user;
}
?>
