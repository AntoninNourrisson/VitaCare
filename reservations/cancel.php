<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Non authentifié.']);
    exit();
}

$data   = json_decode(file_get_contents('php://input'), true);
$id_rdv = (int)($data['id_rdv'] ?? 0);

if (!$id_rdv) {
    http_response_code(400);
    echo json_encode(['error' => 'ID RDV manquant.']);
    exit();
}

$pdo = getPDO();
$stmt = $pdo->prepare('SELECT * FROM rendez_vous WHERE id_rdv = ?');
$stmt->execute([$id_rdv]);
$rdv = $stmt->fetch();

if (!$rdv) {
    http_response_code(404);
    echo json_encode(['error' => 'RDV introuvable.']);
    exit();
}

// Seul le sportif propriétaire ou un admin peut annuler
if ($rdv['id_utilisateur'] != $_SESSION['user_id'] && $_SESSION['user_role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Non autorisé.']);
    exit();
}

$pdo->prepare('UPDATE rendez_vous SET statut = \'annule\' WHERE id_rdv = ?')->execute([$id_rdv]);
$pdo->prepare('UPDATE creneau SET disponible = TRUE WHERE id_creneau = ?')->execute([$rdv['id_creneau']]);

// Notification au praticien
$stmt = $pdo->prepare('SELECT id_responsable, nom FROM service WHERE id_service = ?');
$stmt->execute([$rdv['id_service']]);
$service = $stmt->fetch();
if ($service && $service['id_responsable']) {
    $pdo->prepare('INSERT INTO notification (message, type, id_utilisateur, lien) VALUES (?, \'reservation\', ?, \'/admin\')')
        ->execute(["Un RDV pour « {$service['nom']} » a été annulé.", $service['id_responsable']]);
}

// Notification au sportif si annulé par l'admin
if ($_SESSION['user_role'] === 'admin' && $rdv['id_utilisateur'] != $_SESSION['user_id']) {
    $pdo->prepare('INSERT INTO notification (message, type, id_utilisateur, lien) VALUES (?, \'reservation\', ?, \'/history\')')
        ->execute(["Votre RDV a été annulé par l'administration.", $rdv['id_utilisateur']]);
}

echo json_encode(['message' => 'RDV annulé.']);
