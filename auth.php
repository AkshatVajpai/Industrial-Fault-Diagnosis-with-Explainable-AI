<?php
session_start();


$host = 'localhost';
$dbname = 'fault_diagnosis';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}


if ($_POST['action'] === 'login') {
    $username = $_POST['username'];
    $password = $_POST['password'];
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND password = ?");
    $stmt->execute([$username, $password]);
    $user = $stmt->fetch();
    
    if ($user) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        echo json_encode(['success' => true, 'username' => $user['username']]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    }
}

if ($_POST['action'] === 'logout') {
    session_destroy();
    echo json_encode(['success' => true]);
}


if ($_POST['action'] === 'check') {
    if (isset($_SESSION['user_id'])) {
        echo json_encode(['success' => true, 'username' => $_SESSION['username']]);
    } else {
        echo json_encode(['success' => false]);
    }
}
?>
