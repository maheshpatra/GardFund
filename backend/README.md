# GardFund Backend API

## Setup Instructions

### Prerequisites
- PHP 7.4+ with PDO MySQL extension
- MySQL 5.7+ / MariaDB
- Apache with mod_rewrite enabled

### Database Setup

1. Import the database schema:
```bash
mysql -u root -p < config/schema.sql
```

2. Update database credentials in `config/database.php`:
```php
private $host = "localhost";
private $db_name = "gardfund_db";
private $username = "root";
private $password = "";
```

3. Update JWT secret in `config/jwt_config.php` (optional, change for production).

### Default Admin Login
- **Email:** admin@gardfund.com
- **Password:** password (bcrypt hashed)

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register.php` | No | Register new member |
| POST | `/api/auth/login.php` | No | Login |
| GET/PUT | `/api/auth/profile.php` | Yes | Get/Update profile |
| GET | `/api/members/list.php` | Yes | List all members |
| GET/POST | `/api/contributions/index.php` | Yes | Get/Submit contributions |
| GET/POST | `/api/loans/index.php` | Yes | Get/Request loans |
| POST | `/api/loans/repay.php` | Yes | Submit loan repayment |
| GET | `/api/fund/dashboard.php` | Yes | Fund dashboard stats |
| GET | `/api/hospitals/index.php` | Yes | Hospital directory |
| GET/PUT | `/api/notifications/index.php` | Yes | Notifications |
| GET | `/api/levels/index.php` | Yes | Levels & rewards |
| GET | `/api/admin/dashboard.php` | Admin | Admin dashboard |
| POST | `/api/admin/approve_contribution.php` | Admin | Approve/Reject contribution |
| POST | `/api/admin/approve_loan.php` | Admin | Approve/Reject loan |
| POST | `/api/admin/approve_repayment.php` | Admin | Approve/Reject repayment |

### Deployment
1. Copy the `backend` folder to your PHP server (e.g., `/var/www/html/gardfund/backend/`)
2. Import the SQL schema
3. Update database credentials
4. Ensure `.htaccess` rewrite rules are working
