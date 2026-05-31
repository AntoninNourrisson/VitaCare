<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Non authentifié.']);
    exit();
}

$data       = json_decode(file_get_contents('php://input'), true);
$id_service = (int)($data['id_service'] ?? 0);
$id_creneau = (int)($data['id_creneau'] ?? 0);

if (!$id_service || !$id_creneau) {
    http_response_code(400);
    echo json_encode(['error' => 'Service et créneau obligatoires.']);
    exit();
}

$pdo = getPDO();

// Vérifier disponibilité
$stmt = $pdo->prepare('SELECT disponible FROM creneau WHERE id_creneau = ? AND id_service = ?');
$stmt->execute([$id_creneau, $id_service]);
$c = $stmt->fetch();
if (!$c || !$c['disponible']) {
    http_response_code(409);
    echo json_encode(['error' => 'Créneau non disponible.']);
    exit();
}

try {
    $pdo->prepare('INSERT INTO panier (id_utilisateur, id_service, id_creneau) VALUES (?, ?, ?)')->execute([$_SESSION['user_id'], $id_service, $id_creneau]);
    http_response_code(201);
    echo json_encode(['message' => 'Ajouté au panier.']);
} catch (PDOException $e) {
    http_response_code(409);
    echo json_encode(['error' => 'Déjà dans le panier.']);
}
