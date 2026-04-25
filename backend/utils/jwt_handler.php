<?php
require_once __DIR__ . '/../config/jwt_config.php';

class JWTHandler {
    
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', 3 - (3 + strlen($data)) % 4));
    }

    public static function generateToken($payload) {
        $header = json_encode(['typ' => 'JWT', 'alg' => JWT_ALGORITHM]);
        
        $payload['iat'] = time();
        $payload['exp'] = time() + JWT_EXPIRATION;
        $payload_json = json_encode($payload);

        $base64Header = self::base64UrlEncode($header);
        $base64Payload = self::base64UrlEncode($payload_json);

        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, JWT_SECRET, true);
        $base64Signature = self::base64UrlEncode($signature);

        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }

    public static function validateToken($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }

        list($base64Header, $base64Payload, $base64Signature) = $parts;

        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, JWT_SECRET, true);
        $expectedSignature = self::base64UrlEncode($signature);

        if ($base64Signature !== $expectedSignature) {
            return false;
        }

        $payload = json_decode(self::base64UrlDecode($base64Payload), true);

        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }

        return $payload;
    }

    public static function getTokenFromHeader() {
        $headers = '';
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $headers = trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(
                array_map('ucwords', array_keys($requestHeaders)),
                array_values($requestHeaders)
            );
            if (isset($requestHeaders['Authorization'])) {
                $headers = trim($requestHeaders['Authorization']);
            }
        }

        if (!empty($headers) && preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }

        return null;
    }
}
?>
