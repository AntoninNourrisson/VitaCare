<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id']) || !in_array($_SESSION['user_role'], ['praticien', 'admin'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Accès réservé aux praticiens et admins.']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée.']);
    exit();
}

$data        = json_decode(file_get_contents('php://input'), true);
$nom         = trim($data['nom'] ?? '');
$description = trim($data['description'] ?? '');
$duree       = (int)($data['duree'] ?? 0);
$prix        = (float)($data['prix'] ?? 0);
$pole        = $data['pole'] ?? '';
$categorie   = trim($data['categorie'] ?? '');

$poles_valides = ['reeducation', 'preparation', 'recuperation', 'mental', 'nutrition'];
$errors = [];
if (empty($nom))                        $errors[] = 'Le nom est obligatoire.';
if ($duree <= 0)                        $errors[] = 'La durée doit être positive.';
if (!in_array($pole, $poles_valides))   $errors[] = 'Pôle invalide.';

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['errors' => $errors]);
    exit();
}

$pdo  = getPDO();
$stmt = $pdo->prepare('
    INSERT INTO service (nom, description, duree, prix, pole, categorie, id_responsable)
    VALUES (?, ?, ?, ?, ?, ?, ?)
');
$stmt->execute([$nom, $description, $duree, $prix, $pole, $categorie, $_SESSION['user_id']]);

http_response_code(201);
echo json_encode(['message' => 'Service créé.', 'id' => (int)$pdo->lastInsertId()]);
