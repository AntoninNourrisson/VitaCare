<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Non authentifié.']);
    exit();
}

$pdo  = getPDO();
$stmt = $pdo->prepare('SELECT id_utilisateur, nom, prenom, email, role, telephone, sport_pratique, federation, photo_profil, date_creation FROM utilisateur WHERE id_utilisateur = ?');
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(404);
    echo json_encode(['error' => 'Utilisateur introuvable.']);
    exit();
}

echo json_encode([
    'id'            => (int)$user['id_utilisateur'],
    'nom'           => htmlspecialchars($user['nom']),
    'prenom'        => htmlspecialchars($user['prenom']),
    'email'         => htmlspecialchars($user['email']),
    'role'          => $user['role'],
    'telephone'     => htmlspecialchars($user['telephone'] ?? ''),
    'sport_pratique'=> htmlspecialchars($user['sport_pratique'] ?? ''),
    'federation'    => htmlspecialchars($user['federation'] ?? ''),
    'photo_profil'  => $user['photo_profil'],
    'date_creation' => $user['date_creation'],
]);
