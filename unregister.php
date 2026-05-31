<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

$id = (int)($_GET['id'] ?? 0);
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'ID activité manquant.']);
    exit();
}

$pdo  = getPDO();
$stmt = $pdo->prepare('
    SELECT a.*,
           CONCAT(u.prenom, \' \', u.nom) AS responsable,
           (SELECT COUNT(*) FROM inscription i WHERE i.id_activite = a.id_activite AND i.statut = \'inscrit\') AS inscrits
    FROM activite a
    LEFT JOIN utilisateur u ON a.id_responsable = u.id_utilisateur
    WHERE a.id_activite = ?
');
$stmt->execute([$id]);
$activite = $stmt->fetch();

if (!$activite) {
    http_response_code(404);
    echo json_encode(['error' => 'Activité introuvable.']);
    exit();
}

$activite['id']              = (int)$activite['id_activite'];
$activite['inscrits']        = (int)$activite['inscrits'];
$activite['places_restantes'] = (int)$activite['capacite_max'] - $activite['inscrits'];
$activite['complet']         = $activite['places_restantes'] <= 0;
$activite['passe']           = strtotime($activite['date_debut']) < time();
$activite['nom']             = htmlspecialchars($activite['nom']);

echo json_encode($activite);
