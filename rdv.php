<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id']) || !in_array($_SESSION['user_role'], ['praticien', 'admin'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Accès réservé.']);
    exit();
}

$id_activite = (int)($_GET['id'] ?? 0);
if (!$id_activite) {
    http_response_code(400);
    echo json_encode(['error' => 'ID activité manquant.']);
    exit();
}

$pdo  = getPDO();
$stmt = $pdo->prepare('
    SELECT u.id_utilisateur, u.nom, u.prenom, u.sport_pratique, u.federation, i.date_inscription, i.statut
    FROM inscription i
    JOIN utilisateur u ON i.id_utilisateur = u.id_utilisateur
    WHERE i.id_activite = ? AND i.statut = \'inscrit\'
    ORDER BY i.date_inscription ASC
');
$stmt->execute([$id_activite]);
$participants = $stmt->fetchAll();

foreach ($participants as &$p) {
    $p['nom']    = htmlspecialchars($p['nom']);
    $p['prenom'] = htmlspecialchars($p['prenom']);
}

echo json_encode($participants);
