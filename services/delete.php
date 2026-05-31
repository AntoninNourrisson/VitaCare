<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id']) || !in_array($_SESSION['user_role'], ['praticien', 'admin'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Accès réservé aux praticiens et admins.']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée.']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$id   = (int)($data['id'] ?? $_GET['id'] ?? 0);

if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de service manquant.']);
    exit();
}

$pdo = getPDO();

// Vérifier RDV futurs
$stmt = $pdo->prepare('
    SELECT COUNT(*) FROM rendez_vous
    WHERE id_service = ? AND statut IN (\'en_attente\', \'confirme\') AND date_heure > NOW()
');
$stmt->execute([$id]);
if ((int)$stmt->fetchColumn() > 0) {
    http_response_code(409);
    echo json_encode(['error' => 'Impossible de supprimer : des rendez-vous futurs existent pour ce service.']);
    exit();
}

// Soft delete
$stmt = $pdo->prepare('UPDATE service SET actif = FALSE WHERE id_service = ?');
$stmt->execute([$id]);

echo json_encode(['message' => 'Service supprimé.']);
