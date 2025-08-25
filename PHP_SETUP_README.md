# PHP Auth Quick Setup

1) Install a local web server
- Windows: Install XAMPP from https://www.apachefriends.org/
- Start Apache and MySQL in XAMPP Control Panel

2) Place project files
- Copy the entire project folder to:
  - XAMPP: C:\xampp\htdocs\fault-diagnosis\
- Ensure these files exist there: `index.html`, `results.html`, `compare.html`, `auth.php`, `setup_database.sql`

3) Create database and user
- Open phpMyAdmin: http://localhost/phpmyadmin
- Click Import → Choose `setup_database.sql` from the project folder → Go
  - This creates DB `fault_diagnosis`, table `users`, and user: Abhishek/Abhishek

4) Configure DB credentials (only if needed)
- Open `auth.php` and update if your MySQL creds differ:
```php
$host = 'localhost';
$dbname = 'fault_diagnosis';
$username = 'root';
$password = '';
```

5) Run the app
- Browser: http://localhost/fault-diagnosis/
- Click Login (top-right) → Enter username `Abhishek`, password `Abhishek`
- Button should turn red (Logout)

6) Troubleshooting
- If login fails: verify DB and table in phpMyAdmin
- If connection fails: check `auth.php` credentials and that MySQL is running
- If 404: confirm folder path under `htdocs` and URL path
