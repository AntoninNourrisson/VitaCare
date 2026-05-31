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

$data        = json_decode(file_get_contents('php://input'), true);
$id_activite = (int)($data['id_activite'] ?? 0);

if (!$id_activite) {
    http_response_code(400);
    echo json_encode(['error' => 'ID manquant.']);
    exit();
}

$pdo  = getPDO();
$stmt = $pdo->prepare('SELECT nom FROM activite WHERE id_activite = ?');
$stmt->execute([$id_activite]);
$activite = $stmt->fetch();

if (!$activite) {
    http_response_code(404);
    echo json_encode(['error' => 'Séance introuvable.']);
    exit();
}

// Notifier tous les participants inscrits
$stmt = $pdo->prepare("SELECT id_utilisateur FROM inscription WHERE id_activite = ? AND statut = 'inscrit'");
$stmt->execute([$id_activite]);
$participants = $stmt->fetchAll();

$notif = $pdo->prepare("INSERT INTO notification (message, type, id_utilisateur, lien) VALUES (?, 'reservation', ?, '/activities')");
foreach ($participants as $p) {
    $notif->execute(["La séance « {$activite['nom']} » a été supprimée par l'administration.", $p['id_utilisateur']]);
}

$pdo->prepare('DELETE FROM inscription WHERE id_activite = ?')->execute([$id_activite]);
$pdo->prepare('DELETE FROM activite  WHERE id_activite = ?')->execute([$id_activite]);

echo json_encode(['message' => 'Séance supprimée.']);
