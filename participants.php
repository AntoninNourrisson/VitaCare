<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id']) || !in_array($_SESSION['user_role'], ['praticien', 'admin'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Accès réservé.']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée.']);
    exit();
}

$data         = json_decode(file_get_contents('php://input'), true);
$nom          = trim($data['nom']          ?? '');
$description  = trim($data['description'] ?? '');
$pole         = $data['pole']              ?? '';
$date_debut   = str_replace('T', ' ', $data['date_debut'] ?? '');
$date_fin     = str_replace('T', ' ', $data['date_fin']   ?? '');
$lieu         = trim($data['lieu']         ?? '');
$capacite_max = (int)($data['capacite_max'] ?? 0);

$valid_poles = ['reeducation', 'preparation', 'recuperation', 'mental', 'nutrition'];

if (!$nom || !$pole || !$date_debut || !$date_fin || $capacite_max <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Champs obligatoires manquants.']);
    exit();
}
if (!in_array($pole, $valid_poles)) {
    http_response_code(400);
    echo json_encode(['error' => 'Pôle invalide.']);
    exit();
}

$pdo  = getPDO();
$stmt = $pdo->prepare('
    INSERT INTO activite (nom, description, pole, date_debut, date_fin, lieu, capacite_max, id_responsable)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
');
$stmt->execute([$nom, $description, $pole, $date_debut, $date_fin, $lieu, $capacite_max, $_SESSION['user_id']]);

http_response_code(201);
echo json_encode(['message' => 'Séance créée.', 'id' => (int)$pdo->lastInsertId()]);
