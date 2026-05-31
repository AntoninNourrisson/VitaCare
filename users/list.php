<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id']) || $_SESSION['user_role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès réservé aux administrateurs.']);
    exit();
}

$pdo  = getPDO();
$stmt = $pdo->query('SELECT id_utilisateur, nom, prenom, email, role, telephone, sport_pratique, federation, date_creation FROM utilisateur ORDER BY date_creation DESC');
$users = $stmt->fetchAll();

foreach ($users as &$u) {
    $u['id']     = (int)$u['id_utilisateur'];
    $u['nom']    = htmlspecialchars($u['nom']);
    $u['prenom'] = htmlspecialchars($u['prenom']);
    $u['email']  = htmlspecialchars($u['email']);
}

echo json_encode($users);
