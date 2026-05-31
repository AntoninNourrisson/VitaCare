<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

$id = (int)($_GET['id'] ?? 0);
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de service manquant.']);
    exit();
}

$pdo  = getPDO();
$stmt = $pdo->prepare('
    SELECT s.*, CONCAT(u.prenom, \' \', u.nom) AS praticien, u.email AS praticien_email
    FROM service s
    LEFT JOIN utilisateur u ON s.id_responsable = u.id_utilisateur
    WHERE s.id_service = ? AND s.actif = TRUE
');
$stmt->execute([$id]);
$service = $stmt->fetch();

if (!$service) {
    http_response_code(404);
    echo json_encode(['error' => 'Service introuvable.']);
    exit();
}

// Créneaux disponibles
$stmt2 = $pdo->prepare('
    SELECT * FROM creneau
    WHERE id_service = ? AND disponible = TRUE AND date_creneau >= CURDATE()
    ORDER BY date_creneau, heure_debut
');
$stmt2->execute([$id]);
$creneaux = $stmt2->fetchAll();

foreach ($creneaux as &$c) {
    $c['id'] = (int)$c['id_creneau'];
}

$service['id']      = (int)$service['id_service'];
$service['duree']   = (int)$service['duree'];
$service['prix']    = (float)$service['prix'];
$service['nom']     = htmlspecialchars($service['nom']);
$service['creneaux'] = $creneaux;

echo json_encode($service);
