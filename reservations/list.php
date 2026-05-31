<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Non authentifié.']);
    exit();
}

$pdo = getPDO();

if ($_SESSION['user_role'] === 'admin' || $_SESSION['user_role'] === 'praticien') {
    $stmt = $pdo->query('
        SELECT r.*, s.nom AS service_nom, s.pole, s.duree,
               CONCAT(u.prenom, \' \', u.nom) AS sportif,
               CONCAT(p.prenom, \' \', p.nom) AS praticien
        FROM rendez_vous r
        JOIN service s ON r.id_service = s.id_service
        JOIN utilisateur u ON r.id_utilisateur = u.id_utilisateur
        LEFT JOIN utilisateur p ON s.id_responsable = p.id_utilisateur
        ORDER BY r.date_heure DESC
    ');
} else {
    $stmt = $pdo->prepare('
        SELECT r.*, s.nom AS service_nom, s.pole, s.duree,
               CONCAT(p.prenom, \' \', p.nom) AS praticien
        FROM rendez_vous r
        JOIN service s ON r.id_service = s.id_service
        LEFT JOIN utilisateur p ON s.id_responsable = p.id_utilisateur
        WHERE r.id_utilisateur = ?
        ORDER BY r.date_heure DESC
    ');
    $stmt->execute([$_SESSION['user_id']]);
}

$rdvs = $stmt->fetchAll();
foreach ($rdvs as &$r) {
    $r['id'] = (int)$r['id_rdv'];
}

echo json_encode($rdvs);
