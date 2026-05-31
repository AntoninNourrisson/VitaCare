<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Non authentifié.']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée.']);
    exit();
}

$data           = json_decode(file_get_contents('php://input'), true);
$nom            = trim($data['nom'] ?? '');
$prenom         = trim($data['prenom'] ?? '');
$telephone      = trim($data['telephone'] ?? '');
$sport_pratique = trim($data['sport_pratique'] ?? '');
$federation     = trim($data['federation'] ?? '');
$nouveau_mdp    = $data['mot_de_passe'] ?? '';

$errors = [];
if (empty($nom))    $errors[] = 'Le nom est obligatoire.';
if (empty($prenom)) $errors[] = 'Le prénom est obligatoire.';

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['errors' => $errors]);
    exit();
}

$pdo = getPDO();

if (!empty($nouveau_mdp)) {
    if (strlen($nouveau_mdp) < 8) {
        http_response_code(400);
        echo json_encode(['error' => 'Le mot de passe doit contenir au moins 8 caractères.']);
        exit();
    }
    $hash = password_hash($nouveau_mdp, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('UPDATE utilisateur SET nom=?, prenom=?, telephone=?, sport_pratique=?, federation=?, mot_de_passe=? WHERE id_utilisateur=?');
    $stmt->execute([$nom, $prenom, $telephone, $sport_pratique, $federation, $hash, $_SESSION['user_id']]);
} else {
    $stmt = $pdo->prepare('UPDATE utilisateur SET nom=?, prenom=?, telephone=?, sport_pratique=?, federation=? WHERE id_utilisateur=?');
    $stmt->execute([$nom, $prenom, $telephone, $sport_pratique, $federation, $_SESSION['user_id']]);
}

echo json_encode(['message' => 'Profil mis à jour avec succès.']);
