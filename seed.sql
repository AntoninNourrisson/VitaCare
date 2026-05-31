-- VitaCare — Schéma MySQL
-- Compatible WAMP/MAMP/XAMPP

CREATE DATABASE IF NOT EXISTS vitacare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vitacare;

-- --------------------------------------------------------
-- UTILISATEUR
-- --------------------------------------------------------
CREATE TABLE utilisateur (
    id_utilisateur INT AUTO_INCREMENT PRIMARY KEY,
    nom            VARCHAR(100) NOT NULL,
    prenom         VARCHAR(100) NOT NULL,
    email          VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe   VARCHAR(255) NOT NULL,
    telephone      VARCHAR(20),
    role           ENUM('visiteur', 'sportif', 'praticien', 'admin') DEFAULT 'sportif',
    sport_pratique VARCHAR(100),
    federation     VARCHAR(100),
    photo_profil   VARCHAR(255),
    date_creation  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------
-- SERVICE
-- --------------------------------------------------------
CREATE TABLE service (
    id_service    INT AUTO_INCREMENT PRIMARY KEY,
    nom           VARCHAR(200) NOT NULL,
    description   TEXT,
    duree         INT NOT NULL,
    prix          DECIMAL(10,2),
    pole          ENUM('reeducation', 'preparation', 'recuperation', 'mental', 'nutrition') NOT NULL,
    categorie     VARCHAR(100),
    image         VARCHAR(255),
    id_responsable INT,
    actif         BOOLEAN DEFAULT TRUE,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_responsable) REFERENCES utilisateur(id_utilisateur) ON DELETE SET NULL
);

-- --------------------------------------------------------
-- CRENEAU
-- --------------------------------------------------------
CREATE TABLE creneau (
    id_creneau   INT AUTO_INCREMENT PRIMARY KEY,
    date_creneau DATE NOT NULL,
    heure_debut  TIME NOT NULL,
    heure_fin    TIME NOT NULL,
    disponible   BOOLEAN DEFAULT TRUE,
    id_service   INT NOT NULL,
    FOREIGN KEY (id_service) REFERENCES service(id_service) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- RENDEZ_VOUS
-- --------------------------------------------------------
CREATE TABLE rendez_vous (
    id_rdv        INT AUTO_INCREMENT PRIMARY KEY,
    date_heure    DATETIME NOT NULL,
    statut        ENUM('en_attente', 'confirme', 'refuse', 'annule', 'termine') DEFAULT 'en_attente',
    notes         TEXT,
    id_utilisateur INT NOT NULL,
    id_service    INT NOT NULL,
    id_creneau    INT NOT NULL,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
    FOREIGN KEY (id_service)    REFERENCES service(id_service) ON DELETE CASCADE,
    FOREIGN KEY (id_creneau)    REFERENCES creneau(id_creneau) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- ACTIVITE
-- --------------------------------------------------------
CREATE TABLE activite (
    id_activite    INT AUTO_INCREMENT PRIMARY KEY,
    nom            VARCHAR(200) NOT NULL,
    description    TEXT,
    capacite_max   INT NOT NULL,
    date_debut     DATETIME NOT NULL,
    date_fin       DATETIME NOT NULL,
    lieu           VARCHAR(200),
    pole           ENUM('reeducation', 'preparation', 'recuperation', 'mental', 'nutrition') NOT NULL,
    image          VARCHAR(255),
    id_responsable INT,
    date_creation  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_responsable) REFERENCES utilisateur(id_utilisateur) ON DELETE SET NULL
);

-- --------------------------------------------------------
-- INSCRIPTION
-- --------------------------------------------------------
CREATE TABLE inscription (
    id_inscription  INT AUTO_INCREMENT PRIMARY KEY,
    date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
    statut          ENUM('inscrit', 'annule') DEFAULT 'inscrit',
    id_utilisateur  INT NOT NULL,
    id_activite     INT NOT NULL,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
    FOREIGN KEY (id_activite)    REFERENCES activite(id_activite) ON DELETE CASCADE,
    UNIQUE KEY unique_inscription (id_utilisateur, id_activite)
);

-- --------------------------------------------------------
-- NOTIFICATION
-- --------------------------------------------------------
CREATE TABLE notification (
    id_notification INT AUTO_INCREMENT PRIMARY KEY,
    message         TEXT NOT NULL,
    type            ENUM('reservation', 'activite', 'systeme', 'admin') DEFAULT 'systeme',
    lu              BOOLEAN DEFAULT FALSE,
    date_creation   DATETIME DEFAULT CURRENT_TIMESTAMP,
    id_utilisateur  INT NOT NULL,
    lien            VARCHAR(255),
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- PANIER (bonus)
-- --------------------------------------------------------
CREATE TABLE panier (
    id_panier      INT AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur INT NOT NULL,
    id_service     INT NOT NULL,
    id_creneau     INT NOT NULL,
    date_ajout     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
    FOREIGN KEY (id_service)     REFERENCES service(id_service) ON DELETE CASCADE,
    FOREIGN KEY (id_creneau)     REFERENCES creneau(id_creneau) ON DELETE CASCADE,
    UNIQUE KEY unique_panier (id_utilisateur, id_creneau)
);
