<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

$nom            = trim($data['nom'] ?? '');
$prenom         = trim($data['prenom'] ?? '');
$email          = trim($data['email'] ?? '');
$mot_de_passe   = $data['mot_de_passe'] ?? '';
$confirmation   = $data['confirmation'] ?? '';
$telephone      = trim($data['telephone'] ?? '');
$sport_pratique = trim($data['sport_pratique'] ?? '');
$federation     = trim($data['federation'] ?? '');

// Validation
$errors = [];
if (empty($nom))          $errors[] = 'Le nom est obligatoire.';
if (empty($prenom))        $errors[] = 'Le prénom est obligatoire.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'L\'email n\'est pas valide.';
if (strlen($mot_de_passe) < 8) $errors[] = 'Le mot de passe doit contenir au moins 8 caractères.';
if ($mot_de_passe !== $confirmation) $errors[] = 'Les mots de passe ne correspondent pas.';

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['errors' => $errors]);
    exit();
}

$pdo = getPDO();

// Vérifier unicité email
$stmt = $pdo->prepare('SELECT id_utilisateur FROM utilisateur WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['error' => 'Cet email est déjà utilisé.']);
    exit();
}

$hash = password_hash($mot_de_passe, PASSWORD_DEFAULT);

$stmt = $pdo->prepare('
    INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, telephone, role, sport_pratique, federation)
    VALUES (?, ?, ?, ?, ?, \'sportif\', ?, ?)
');
$stmt->execute([$nom, $prenom, $email, $hash, $telephone, $sport_pratique, $federation]);
$id = $pdo->lastInsertId();

// Notification de bienvenue
$pdo->prepare('INSERT INTO notification (message, type, id_utilisateur, lien) VALUES (?, \'systeme\', ?, ?)')
    ->execute(["Bienvenue sur VitaCare, $prenom ! Découvrez nos 5 pôles de services.", $id, '/services']);

http_response_code(201);
echo json_encode(['message' => 'Compte créé avec succès.', 'id' => (int)$id]);
