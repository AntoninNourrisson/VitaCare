<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

$pdo = getPDO();

$pole      = $_GET['pole'] ?? '';
$search    = $_GET['search'] ?? '';
$sort      = $_GET['sort'] ?? 'nom';
$direction = strtoupper($_GET['dir'] ?? 'ASC') === 'DESC' ? 'DESC' : 'ASC';

$allowed_sorts = ['nom', 'prix', 'duree'];
if (!in_array($sort, $allowed_sorts)) $sort = 'nom';

$sql    = 'SELECT s.*, CONCAT(u.prenom, \' \', u.nom) AS praticien FROM service s LEFT JOIN utilisateur u ON s.id_responsable = u.id_utilisateur WHERE s.actif = TRUE';
$params = [];

if ($pole !== '') {
    $sql .= ' AND s.pole = ?';
    $params[] = $pole;
}
if ($search !== '') {
    $sql .= ' AND (s.nom LIKE ? OR s.description LIKE ? OR CONCAT(u.prenom, \' \', u.nom) LIKE ?)';
    $like = '%' . $search . '%';
    $params = array_merge($params, [$like, $like, $like]);
}

$sql .= " ORDER BY s.$sort $direction";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$services = $stmt->fetchAll();

foreach ($services as &$s) {
    $s['id']   = (int)$s['id_service'];
    $s['duree'] = (int)$s['duree'];
    $s['prix']  = (float)$s['prix'];
    $s['nom']   = htmlspecialchars($s['nom']);
}

echo json_encode($services);
