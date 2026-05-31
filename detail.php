<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Non authentifié.']);
    exit();
}

$pdo    = getPDO();
$uid    = $_SESSION['user_id'];
$role   = $_SESSION['user_role'];
$action = $_GET['action'] ?? '';

// ── stats ──────────────────────────────────────────────────────
if ($action === 'stats') {
    if ($role === 'admin') {
        $total_users    = (int)$pdo->query('SELECT COUNT(*) FROM utilisateur')->fetchColumn();
        $rdv_mois       = (int)$pdo->query('SELECT COUNT(*) FROM rendez_vous WHERE MONTH(date_heure) = MONTH(CURDATE()) AND YEAR(date_heure) = YEAR(CURDATE())')->fetchColumn();
        $en_attente     = (int)$pdo->query("SELECT COUNT(*) FROM rendez_vous WHERE statut = 'en_attente'")->fetchColumn();
        $total_services = (int)$pdo->query('SELECT COUNT(*) FROM service WHERE actif = TRUE')->fetchColumn();

        $stmt = $pdo->query('SELECT s.pole, COUNT(*) AS nb FROM rendez_vous r JOIN service s ON r.id_service = s.id_service GROUP BY s.pole');
        $repartition = $stmt->fetchAll();

        echo json_encode([
            'total_users'       => $total_users,
            'rdv_mois'          => $rdv_mois,
            'en_attente'        => $en_attente,
            'total_services'    => $total_services,
            'repartition_poles' => $repartition,
        ]);
    } else {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM rendez_vous WHERE id_utilisateur = ? AND date_heure > NOW() AND statut IN ('en_attente','confirme')");
        $stmt->execute([$uid]);
        $rdv_a_venir = (int)$stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM inscription i JOIN activite a ON i.id_activite = a.id_activite WHERE i.id_utilisateur = ? AND i.statut = 'inscrit' AND a.date_debut > NOW()");
        $stmt->execute([$uid]);
        $activites_inscrit = (int)$stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM rendez_vous WHERE id_utilisateur = ? AND statut = 'en_attente'");
        $stmt->execute([$uid]);
        $en_attente = (int)$stmt->fetchColumn();

        $stmt = $pdo->prepare('SELECT COUNT(*) FROM rendez_vous WHERE id_utilisateur = ?');
        $stmt->execute([$uid]);
        $total_consultations = (int)$stmt->fetchColumn();

        $stmt = $pdo->prepare('SELECT s.pole, COUNT(*) AS nb FROM rendez_vous r JOIN service s ON r.id_service = s.id_service WHERE r.id_utilisateur = ? GROUP BY s.pole');
        $stmt->execute([$uid]);
        $repartition = $stmt->fetchAll();

        echo json_encode([
            'rdv_a_venir'         => $rdv_a_venir,
            'activites_inscrit'   => $activites_inscrit,
            'en_attente'          => $en_attente,
            'total_consultations' => $total_consultations,
            'repartition_poles'   => $repartition,
        ]);
    }
    exit();
}

// ── recent ─────────────────────────────────────────────────────
if ($action === 'recent') {
    $stmt = $pdo->prepare('
        SELECT r.id_rdv, r.date_heure, r.statut, s.nom AS service_nom, s.pole,
               CONCAT(p.prenom, \' \', p.nom) AS praticien
        FROM rendez_vous r
        JOIN service s ON r.id_service = s.id_service
        LEFT JOIN utilisateur p ON s.id_responsable = p.id_utilisateur
        WHERE r.id_utilisateur = ?
        ORDER BY r.date_heure DESC LIMIT 5
    ');
    $stmt->execute([$uid]);
    $rdvs = $stmt->fetchAll();

    $stmt = $pdo->prepare("
        SELECT a.id_activite, a.nom, a.pole, a.date_debut, a.lieu,
               (SELECT COUNT(*) FROM inscription WHERE id_activite = a.id_activite AND statut = 'inscrit') AS inscrits,
               a.capacite_max
        FROM inscription i
        JOIN activite a ON i.id_activite = a.id_activite
        WHERE i.id_utilisateur = ? AND i.statut = 'inscrit' AND a.date_debut > NOW()
        ORDER BY a.date_debut ASC LIMIT 5
    ");
    $stmt->execute([$uid]);
    $activites = $stmt->fetchAll();

    echo json_encode(['rdvs' => $rdvs, 'activites' => $activites]);
    exit();
}

http_response_code(400);
echo json_encode(['error' => 'Action manquante (stats|recent).']);
