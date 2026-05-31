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

// GET → liste des notifications
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare('SELECT * FROM notification WHERE id_utilisateur = ? ORDER BY date_creation DESC');
    $stmt->execute([$_SESSION['user_id']]);
    $notifs = $stmt->fetchAll();

    $unread = 0;
    foreach ($notifs as &$n) {
        $n['id'] = (int)$n['id_notification'];
        $n['lu'] = (bool)$n['lu'];
        if (!$n['lu']) $unread++;
    }

    echo json_encode(['notifications' => $notifs, 'unread' => $unread]);
    exit();
}

// POST → marquer comme lu
$data = json_decode(file_get_contents('php://input'), true);
$id   = (int)($data['id']  ?? 0);
$all  = (bool)($data['all'] ?? false);

if ($all) {
    $pdo->prepare('UPDATE notification SET lu = TRUE WHERE id_utilisateur = ?')->execute([$_SESSION['user_id']]);
} elseif ($id) {
    $pdo->prepare('UPDATE notification SET lu = TRUE WHERE id_notification = ? AND id_utilisateur = ?')
        ->execute([$id, $_SESSION['user_id']]);
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Paramètre manquant.']);
    exit();
}

echo json_encode(['message' => 'Notification(s) marquée(s) comme lue(s).']);
