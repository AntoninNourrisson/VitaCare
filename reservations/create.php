<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Non authentifié.']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée.']);
    exit();
}

$data       = json_decode(file_get_contents('php://input'), true);
$id_service = (int)($data['id_service'] ?? 0);
$id_creneau = (int)($data['id_creneau'] ?? 0);
$notes      = trim($data['notes'] ?? '');

if (!$id_service || !$id_creneau) {
    http_response_code(400);
    echo json_encode(['error' => 'Service et créneau obligatoires.']);
    exit();
}

$pdo = getPDO();

// Vérifier disponibilité du créneau (avec verrou)
$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare('SELECT disponible, date_creneau, heure_debut FROM creneau WHERE id_creneau = ? AND id_service = ? FOR UPDATE');
    $stmt->execute([$id_creneau, $id_service]);
    $creneau = $stmt->fetch();

    if (!$creneau) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['error' => 'Créneau introuvable.']);
        exit();
    }
    if (!$creneau['disponible']) {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode(['error' => 'Ce créneau n\'est plus disponible.']);
        exit();
    }

    $date_heure = $creneau['date_creneau'] . ' ' . $creneau['heure_debut'];

    // Créer le RDV
    $stmt = $pdo->prepare('INSERT INTO rendez_vous (date_heure, statut, notes, id_utilisateur, id_service, id_creneau) VALUES (?, \'en_attente\', ?, ?, ?, ?)');
    $stmt->execute([$date_heure, $notes, $_SESSION['user_id'], $id_service, $id_creneau]);
    $id_rdv = $pdo->lastInsertId();

    // Bloquer le créneau
    $pdo->prepare('UPDATE creneau SET disponible = FALSE WHERE id_creneau = ?')->execute([$id_creneau]);

    // Récupérer le nom du service pour la notification
    $stmt = $pdo->prepare('SELECT nom FROM service WHERE id_service = ?');
    $stmt->execute([$id_service]);
    $service = $stmt->fetch();

    // Notification au sportif
    $pdo->prepare('INSERT INTO notification (message, type, id_utilisateur, lien) VALUES (?, \'reservation\', ?, ?)')
        ->execute(["Votre demande de RDV pour « {$service['nom']} » est en attente de validation.", $_SESSION['user_id'], "/history"]);

    // Notification aux admins
    $stmt = $pdo->query('SELECT id_utilisateur FROM utilisateur WHERE role = \'admin\'');
    $admins = $stmt->fetchAll();
    $stmt_notif = $pdo->prepare('INSERT INTO notification (message, type, id_utilisateur, lien) VALUES (?, \'admin\', ?, \'/admin\')');
    foreach ($admins as $admin) {
        $stmt_notif->execute(["Nouvelle demande de RDV pour « {$service['nom']} ».", $admin['id_utilisateur']]);
    }

    $pdo->commit();
    http_response_code(201);
    echo json_encode(['message' => 'Réservation créée.', 'id_rdv' => (int)$id_rdv]);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur.']);
}
