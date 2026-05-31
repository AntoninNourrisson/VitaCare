<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Non authentifié.']);
    exit();
}

$pdo  = getPDO();
$stmt = $pdo->prepare('
    SELECT p.id_panier, p.id_service, p.id_creneau, p.date_ajout,
           s.nom AS service_nom, s.pole, s.duree, s.prix,
           c.date_creneau, c.heure_debut, c.heure_fin, c.disponible
    FROM panier p
    JOIN service s ON p.id_service = s.id_service
    JOIN creneau c ON p.id_creneau = c.id_creneau
    WHERE p.id_utilisateur = ?
    ORDER BY p.date_ajout ASC
');
$stmt->execute([$_SESSION['user_id']]);
$items = $stmt->fetchAll();

foreach ($items as &$item) {
    $item['prix']       = (float)$item['prix'];
    $item['disponible'] = (bool)$item['disponible'];
}

echo json_encode($items);
