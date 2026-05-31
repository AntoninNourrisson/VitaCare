<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Non authentifié.']);
    exit();
}

$data       = json_decode(file_get_contents('php://input'), true);
$id_activite = (int)($data['id_activite'] ?? 0);

if (!$id_activite) {
    http_response_code(400);
    echo json_encode(['error' => 'ID activité manquant.']);
    exit();
}

$pdo = getPDO();
$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare('SELECT * FROM activite WHERE id_activite = ? FOR UPDATE');
    $stmt->execute([$id_activite]);
    $activite = $stmt->fetch();

    if (!$activite) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['error' => 'Activité introuvable.']);
        exit();
    }
    if (strtotime($activite['date_debut']) < time()) {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode(['error' => 'Impossible de s\'inscrire à une activité passée.']);
        exit();
    }

    // Vérifier places
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM inscription WHERE id_activite = ? AND statut = \'inscrit\'');
    $stmt->execute([$id_activite]);
    $inscrits = (int)$stmt->fetchColumn();

    if ($inscrits >= $activite['capacite_max']) {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode(['error' => 'Cette activité est complète.']);
        exit();
    }

    // Vérifier déjà inscrit
    $stmt = $pdo->prepare('SELECT id_inscription, statut FROM inscription WHERE id_utilisateur = ? AND id_activite = ?');
    $stmt->execute([$_SESSION['user_id'], $id_activite]);
    $existing = $stmt->fetch();

    if ($existing && $existing['statut'] === 'inscrit') {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode(['error' => 'Vous êtes déjà inscrit à cette activité.']);
        exit();
    }

    if ($existing) {
        $pdo->prepare('UPDATE inscription SET statut = \'inscrit\' WHERE id_inscription = ?')->execute([$existing['id_inscription']]);
    } else {
        $pdo->prepare('INSERT INTO inscription (id_utilisateur, id_activite) VALUES (?, ?)')->execute([$_SESSION['user_id'], $id_activite]);
    }

    $pdo->prepare('INSERT INTO notification (message, type, id_utilisateur, lien) VALUES (?, \'activite\', ?, ?)')
        ->execute(["Inscription confirmée à « {$activite['nom']} ».", $_SESSION['user_id'], "/activities/$id_activite"]);

    $pdo->commit();
    http_response_code(201);
    echo json_encode(['message' => 'Inscription réussie.']);
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur.']);
}
