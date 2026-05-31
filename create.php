<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if (empty($_SESSION['user_id']) || !in_array($_SESSION['user_role'], ['praticien', 'admin'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Accès réservé.']);
    exit();
}

$pdo = getPDO();

// GET → créneaux déjà pris pour un service à une date
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id_service = (int)($_GET['id_service'] ?? 0);
    $date       = $_GET['date'] ?? '';

    if (!$id_service || !$date || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        http_response_code(400);
        echo json_encode(['error' => 'id_service et date requis.']);
        exit();
    }

    $stmt = $pdo->prepare('SELECT heure_debut, heure_fin FROM creneau WHERE id_service = ? AND date_creneau = ? ORDER BY heure_debut');
    $stmt->execute([$id_service, $date]);
    echo json_encode($stmt->fetchAll());
    exit();
}

// POST → créer un créneau
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data        = json_decode(file_get_contents('php://input'), true);
    $id_service  = (int)($data['id_service']  ?? 0);
    $date        = $data['date_creneau']       ?? '';
    $heure_debut = $data['heure_debut']        ?? '';
    $heure_fin   = $data['heure_fin']          ?? '';

    if (!$id_service || !$date || !$heure_debut || !$heure_fin) {
        http_response_code(400);
        echo json_encode(['error' => 'Champs manquants.']);
        exit();
    }

    $stmt = $pdo->prepare('SELECT COUNT(*) FROM creneau WHERE id_service = ? AND date_creneau = ? AND heure_debut < ? AND heure_fin > ?');
    $stmt->execute([$id_service, $date, $heure_fin, $heure_debut]);
    if ((int)$stmt->fetchColumn() > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'Ce créneau chevauche un créneau existant.']);
        exit();
    }

    $stmt = $pdo->prepare('INSERT INTO creneau (date_creneau, heure_debut, heure_fin, disponible, id_service) VALUES (?, ?, ?, TRUE, ?)');
    $stmt->execute([$date, $heure_debut, $heure_fin, $id_service]);

    http_response_code(201);
    echo json_encode(['message' => 'Créneau créé.', 'id' => (int)$pdo->lastInsertId()]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Méthode non autorisée.']);
