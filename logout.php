<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$email        = trim($data['email'] ?? '');
$mot_de_passe = $data['mot_de_passe'] ?? '';

if (empty($email) || empty($mot_de_passe)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email et mot de passe obligatoires.']);
    exit();
}

$pdo  = getPDO();
$stmt = $pdo->prepare('SELECT * FROM utilisateur WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($mot_de_passe, $user['mot_de_passe'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Email ou mot de passe incorrect.']);
    exit();
}

$_SESSION['user_id']   = $user['id_utilisateur'];
$_SESSION['user_role'] = $user['role'];

echo json_encode([
    'message' => 'Connexion réussie.',
    'user'    => [
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
    ],
]);
