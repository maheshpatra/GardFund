<?php
class Database
{
    private $host = "localhost";
    private $db_name = "gardfund_db";
    private $username = "gardfund_user";
    private $password = "m8Lx3EPpHpZnDLJJ";
    private $conn;

    public function getConnection()
    {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->exec("set names utf8mb4");
            $this->conn->exec("SET time_zone = '+05:30'");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $exception) {
            echo json_encode(["error" => "Connection error: " . $exception->getMessage()]);
            exit;
        }
        return $this->conn;
    }
}
?>