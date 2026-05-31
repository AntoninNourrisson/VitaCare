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
    SELECT p.*, c.date_creneau, c.heure_debut, c.disponible, s.nom AS service_nom
    FROM panier p
    JOIN creneau c ON p.id_creneau = c.id_creneau
    JOIN service s ON p.id_service = s.id_service
    WHERE p.id_utilisateur = ?
');
$stmt->execute([$_SESSION['user_id']]);
$items = $stmt->fetchAll();

if (empty($items)) {
    http_response_code(400);
    echo json_encode(['error' => 'Panier vide.']);
    exit();
}

$pdo->beginTransaction();
$created = [];
$errors  = [];

try {
    foreach ($items as $item) {
        if (!$item['disponible']) {
            $errors[] = "Le créneau pour « {$item['service_nom']} » n'est plus disponible.";
            continue;
        }
        $date_heure = $item['date_creneau'] . ' ' . $item['heure_debut'];
        $pdo->prepare('INSERT INTO rendez_vous (date_heure, statut, id_utilisateur, id_service, id_creneau) VALUES (?, \'en_attente\', ?, ?, ?)')
            ->execute([$date_heure, $_SESSION['user_id'], $item['id_service'], $item['id_creneau']]);
        $id_rdv = $pdo->lastInsertId();
        $pdo->prepare('UPDATE creneau SET disponible = FALSE WHERE id_creneau = ?')->execute([$item['id_creneau']]);
        $pdo->prepare('DELETE FROM panier WHERE id_panier = ?')->execute([$item['id_panier']]);
        $pdo->prepare('INSERT INTO notification (message, type, id_utilisateur, lien) VALUES (?, \'reservation\', ?, \'/history\')')
            ->execute(["Demande de RDV créée pour « {$item['service_nom']} ».", $_SESSION['user_id']]);
        $created[] = (int)$id_rdv;
    }
    $pdo->commit();
    echo json_encode(['message' => count($created) . ' réservation(s) créée(s).', 'ids' => $created, 'errors' => $errors]);
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur.']);
}
