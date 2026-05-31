<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Non authentifié.']);
    exit();
}

$data           = json_decode(file_get_contents('php://input'), true);
$id_rdv         = (int)($data['id_rdv'] ?? 0);
$nouveau_creneau = (int)($data['id_creneau'] ?? 0);

if (!$id_rdv || !$nouveau_creneau) {
    http_response_code(400);
    echo json_encode(['error' => 'Paramètres manquants.']);
    exit();
}

$pdo = getPDO();
$stmt = $pdo->prepare('SELECT * FROM rendez_vous WHERE id_rdv = ? AND id_utilisateur = ?');
$stmt->execute([$id_rdv, $_SESSION['user_id']]);
$rdv = $stmt->fetch();

if (!$rdv) {
    http_response_code(404);
    echo json_encode(['error' => 'RDV introuvable ou non autorisé.']);
    exit();
}

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare('SELECT disponible, date_creneau, heure_debut FROM creneau WHERE id_creneau = ? AND id_service = ? FOR UPDATE');
    $stmt->execute([$nouveau_creneau, $rdv['id_service']]);
    $creneau = $stmt->fetch();

    if (!$creneau || !$creneau['disponible']) {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode(['error' => 'Créneau non disponible.']);
        exit();
    }

    $date_heure = $creneau['date_creneau'] . ' ' . $creneau['heure_debut'];

    // Libérer l'ancien créneau
    $pdo->prepare('UPDATE creneau SET disponible = TRUE WHERE id_creneau = ?')->execute([$rdv['id_creneau']]);
    // Bloquer le nouveau
    $pdo->prepare('UPDATE creneau SET disponible = FALSE WHERE id_creneau = ?')->execute([$nouveau_creneau]);
    // Mettre à jour le RDV
    $pdo->prepare('UPDATE rendez_vous SET id_creneau = ?, date_heure = ?, statut = \'en_attente\' WHERE id_rdv = ?')
        ->execute([$nouveau_creneau, $date_heure, $id_rdv]);

    // Notifier le praticien
    $stmt = $pdo->prepare('SELECT id_responsable, nom FROM service WHERE id_service = ?');
    $stmt->execute([$rdv['id_service']]);
    $service = $stmt->fetch();
    if ($service && $service['id_responsable']) {
        $pdo->prepare('INSERT INTO notification (message, type, id_utilisateur, lien) VALUES (?, \'reservation\', ?, \'/admin\')')
            ->execute(["Un RDV pour « {$service['nom']} » a été modifié.", $service['id_responsable']]);
    }

    $pdo->commit();
    echo json_encode(['message' => 'RDV modifié.']);
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur.']);
}
