<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

$pdo  = getPDO();
$pole = $_GET['pole'] ?? '';

$sql    = '
    SELECT a.*,
           CONCAT(u.prenom, \' \', u.nom) AS responsable,
           (SELECT COUNT(*) FROM inscription i WHERE i.id_activite = a.id_activite AND i.statut = \'inscrit\') AS inscrits
    FROM activite a
    LEFT JOIN utilisateur u ON a.id_responsable = u.id_utilisateur
    WHERE 1=1
';
$params = [];

if ($pole !== '') {
    $sql .= ' AND a.pole = ?';
    $params[] = $pole;
}
$sql .= ' ORDER BY a.date_debut ASC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$activites = $stmt->fetchAll();

foreach ($activites as &$a) {
    $a['id']           = (int)$a['id_activite'];
    $a['capacite_max'] = (int)$a['capacite_max'];
    $a['inscrits']     = (int)$a['inscrits'];
    $a['places_restantes'] = $a['capacite_max'] - $a['inscrits'];
    $a['complet']      = $a['places_restantes'] <= 0;
    $a['passe']        = strtotime($a['date_debut']) < time();
    $a['nom']          = htmlspecialchars($a['nom']);
}

echo json_encode($activites);
