# Cahier des charges

## Projet

Application web de gestion commerciale et opérationnelle "Moul l Hanout"

## Version du document

v2.0 - version renforcée "cadre entreprise"

## Date

22/03/2026

## Statut

Document de cadrage projet - base de consultation, de validation métier et de pilotage delivery

## 1. Contexte et vision

Moul l Hanout est une application web destinée à digitaliser la gestion quotidienne d'un commerce de proximité. Le besoin métier principal est de remplacer une gestion manuelle ou partiellement structurée par une plateforme fiable, simple et rapide, couvrant les opérations de vente, la gestion du catalogue, le suivi des stocks et la visibilité de pilotage.

Dans un contexte entreprise, le projet ne doit pas être considéré comme une simple application de caisse, mais comme un socle numérique opérationnel capable de soutenir la croissance de l'activité, de réduire les erreurs de gestion, d'améliorer la traçabilité et de fournir des données de décision fiables.

Le produit visé doit être exploitable en conditions réelles, pendant les heures d'ouverture, avec un niveau de qualité compatible avec un usage quotidien intensif.

## 2. Objectifs du projet

### 2.1 Objectifs métier

- Réduire le temps de traitement d'une vente en caisse.
- Diminuer les erreurs de prix, de stock et de saisie.
- Donner au gérant une vision claire du chiffre d'affaires, des ventes et des ruptures.
- Sécuriser les opérations sensibles par des rôles et des traces d'audit.
- Préparer une base évolutive pour des extensions futures: multi-boutiques, mobilité, reporting avancé, intégrations.

### 2.2 Objectifs opérationnels

- Disposer d'un MVP exploitable en production.
- Garantir la stabilité du parcours de vente, prioritaire pour le métier.
- Standardiser les données produits, ventes et mouvements de stock.
- Réduire la dépendance à des fichiers informels ou à une gestion non centralisée.

### 2.3 Objectifs de qualité

- Offrir une expérience fluide sur desktop et tablette.
- Garantir un niveau de sécurité conforme aux bonnes pratiques professionnelles.
- Assurer la maintenabilité de la solution, sa supervision et sa capacité d'évolution.

## 3. Périmètre du projet

### 3.1 Périmètre couvert

Le projet couvre la conception, le développement, la validation, le déploiement et la mise en service d'une application web de gestion commerciale comprenant:

- authentification et gestion des accès;
- gestion des utilisateurs et des rôles;
- gestion du catalogue produits et des catégories;
- gestion du stock et des mouvements;
- parcours de vente type POS web;
- rapports de base;
- journalisation des actions sensibles;
- administration fonctionnelle minimale.

### 3.2 Hors périmètre initial

Sauf validation explicite lors du cadrage, les éléments suivants sont exclus du MVP:

- application mobile native;
- intégration comptable;
- e-commerce;
- fidélité client;
- promotions complexes;
- gestion multi-entrepôts avancée;
- gestion fiscale spécifique par pays;
- intégration matérielle avancée hors impression navigateur standard.

## 4. Parties prenantes

### 4.1 Parties prenantes métier

- Sponsor projet
- Gérant / owner du commerce
- Caissier / opérateur de vente
- Responsable stock ou utilisateur habilité

### 4.2 Parties prenantes projet

- Product Owner ou représentant métier
- Chef de projet / Delivery Manager
- UX/UI Designer
- Développeur frontend
- Développeur backend
- QA / testeur
- DevOps / administrateur plateforme
- Référent sécurité / conformité selon contexte

## 5. Utilisateurs cibles

### 5.1 Gérant

Le gérant pilote l'activité, administre le catalogue, consulte les rapports, suit le stock, gère les utilisateurs et réalise les actions sensibles.

### 5.2 Caissier

Le caissier exécute les ventes, recherche les produits, encaisse les paiements et consulte uniquement les informations nécessaires à son activité.

### 5.3 Administrateur fonctionnel

Selon l'organisation cible, un administrateur peut être chargé de paramétrer la boutique, les rôles, certaines références et le support de premier niveau.

## 6. Enjeux et problématiques adressés

Le projet doit répondre aux problèmes récurrents observés dans les commerces de proximité:

- absence de visibilité fiable sur le stock réel;
- erreurs fréquentes de vente ou de prix;
- difficulté à suivre les produits les plus performants;
- manque de traçabilité des modifications sensibles;
- faible standardisation des données;
- dépendance forte aux personnes et aux habitudes locales.

## 7. Hypothèses structurantes

En l'absence d'informations définitives, les hypothèses suivantes sont retenues:

- le premier usage vise une boutique unique;
- les profils principaux sont "Owner" et "Cashier";
- l'application est utilisée principalement en français, avec possibilité d'évolution vers l'arabe;
- les équipements cibles sont PC et tablette;
- le projet est déployé d'abord sur le web responsive;
- le pays d'exploitation peut imposer ultérieurement des exigences de conformité locale;
- le besoin d'offline est limité au MVP et pourra être renforcé en phase ultérieure.

Ces hypothèses devront être validées en phase de cadrage avant engagement final sur le coût, le planning et la recette.

## 8. Exigences fonctionnelles

### 8.1 Authentification et gestion des accès

L'application doit permettre:

- la connexion sécurisée des utilisateurs;
- la déconnexion;
- la réinitialisation du mot de passe;
- l'activation ou la désactivation d'un compte;
- la gestion des rôles et des permissions côté serveur.

Règles associées:

- aucune action sensible ne doit être protégée uniquement côté interface;
- les droits doivent être contrôlés systématiquement par l'API;
- les sessions doivent être limitées dans le temps et traçables.

### 8.2 Gestion des utilisateurs

Le système doit permettre:

- la création d'un utilisateur;
- l'affectation d'un rôle;
- la modification du statut actif/inactif;
- la consultation de l'historique des actions administratives critiques.

### 8.3 Catalogue produits

Le module catalogue doit permettre:

- créer, modifier, archiver et consulter un produit;
- gérer les catégories;
- stocker les champs suivants au minimum:
  nom, référence interne, code-barres, catégorie, prix de vente, seuil d'alerte, état actif;
- gérer une image produit en option;
- rechercher un produit rapidement par nom, code ou catégorie.

Règles associées:

- un produit inactif ne doit pas apparaître dans la vente courante;
- les champs obligatoires doivent être validés à la saisie et côté serveur;
- les doublons critiques doivent être contrôlés, notamment sur les références ou codes-barres si la règle métier l'impose.

### 8.4 Stock et mouvements

Le système doit permettre:

- consulter le stock courant par produit;
- enregistrer des entrées, sorties et ajustements;
- historiser chaque mouvement;
- détecter les seuils bas et les ruptures;
- visualiser une liste priorisée des produits à réapprovisionner.

Règles associées:

- toute variation de stock doit générer un mouvement;
- la suppression physique d'un mouvement ne doit pas être autorisée en exploitation standard;
- les ajustements doivent exiger un motif;
- les opérations doivent préserver la cohérence transactionnelle.

### 8.5 Vente / POS web

Le parcours de vente est le parcours critique du MVP. Il doit permettre:

- rechercher un produit;
- ajouter un produit au panier;
- modifier les quantités;
- appliquer une remise simple selon les droits autorisés;
- sélectionner un mode de paiement;
- valider la vente;
- calculer le rendu monnaie pour les paiements cash;
- générer un récapitulatif de ticket.

Règles associées:

- la validation d'une vente crée la transaction, les lignes de vente et les mouvements de stock;
- toute vente validée doit être horodatée et rattachée à l'utilisateur concerné;
- une annulation ou correction doit suivre une règle métier explicite et tracée;
- les montants affichés et persistés doivent rester cohérents.

### 8.6 Rapports et tableaux de bord

Le système doit proposer au minimum:

- chiffre d'affaires jour, semaine, mois;
- nombre de ventes;
- panier moyen;
- top produits vendus;
- état des ruptures et alertes stock.

En option si les coûts d'achat sont renseignés:

- estimation de marge;
- performance par catégorie;
- produits à faible rotation.

### 8.7 Audit et traçabilité

Le système doit journaliser les actions sensibles, notamment:

- connexion et échec de connexion;
- création ou modification d'utilisateur;
- modification de prix;
- ajustement de stock;
- annulation de vente;
- export de données.

Chaque trace doit comporter au minimum:

- identifiant de l'utilisateur;
- horodatage;
- type d'action;
- objet concerné;
- valeur utile de contexte selon le cas.

### 8.8 Exports

Le système doit permettre l'export CSV au minimum pour:

- ventes;
- produits;
- stock;
- mouvements de stock.

Les exports doivent être réservés aux profils autorisés.

## 9. Priorisation

### 9.1 P0 - MVP obligatoire

- authentification
- rôles et permissions
- gestion utilisateurs minimale
- catalogue produits
- catégories
- stock et mouvements
- alertes de stock
- parcours de vente web
- paiements simples
- audit des actions sensibles
- rapports essentiels

### 9.2 P1 - Renforcement post-MVP

- ticket PDF ou impression enrichie
- exports avancés
- indicateurs de marge
- mode PWA partiel
- tableaux de bord enrichis
- meilleure gestion des annulations et retours

### 9.3 P2 - Evolutions

- multi-boutiques
- lots et péremption
- intégrations externes
- comptabilité
- e-commerce
- fidélité

## 10. Exigences non fonctionnelles

### 10.1 Performance

Le système devra respecter les objectifs suivants:

- interface de vente réactive sur matériel courant;
- temps de réponse compatible avec un usage en caisse;
- Core Web Vitals au niveau "bon" sur les écrans stratégiques;
- pagination et filtrage sur les listes volumineuses;
- optimisation des ressources frontend.

Objectifs indicatifs:

- LCP <= 2,5 s;
- INP <= 200 ms;
- CLS <= 0,1.

### 10.2 Disponibilité et continuité de service

Le service devra viser:

- disponibilité cible MVP: 99,5%;
- surveillance applicative et infrastructure;
- sauvegardes automatiques;
- tests de restauration planifiés;
- procédure de reprise sur incident documentée.

### 10.3 Sécurité

La solution devra intégrer au minimum:

- authentification sécurisée;
- contrôle d'accès côté serveur;
- validation stricte des entrées;
- gestion sécurisée des secrets;
- journalisation des événements sensibles;
- protection contre les attaques usuelles web;
- politique de mot de passe et de session;
- limitation du brute force;
- principe du moindre privilège;
- durcissement des environnements.

Référentiels de référence:

- OWASP ASVS pour l'application web et l'API;
- OWASP Top 10 pour les risques prioritaires;
- bonnes pratiques SDLC sécurisées.

### 10.4 Accessibilité

L'application doit respecter un niveau d'accessibilité compatible avec un usage professionnel:

- navigation clavier complète;
- libellés compréhensibles;
- contrastes suffisants;
- messages d'erreur explicites;
- composants cohérents;
- structure adaptée aux lecteurs d'écran autant que possible.

Objectif cible recommandé: WCAG 2.2 niveau AA.

### 10.5 Compatibilité

Navigateurs cibles:

- Chrome et Edge, versions récentes;
- Firefox, versions récentes;
- Safari récent sur tablette compatible.

### 10.6 Maintenabilité

La solution doit être maintenable par une équipe technique standard grâce à:

- architecture claire;
- conventions de code;
- documentation technique minimale;
- tests automatisés;
- pipeline de déploiement;
- séparation des environnements.

## 11. Architecture cible

### 11.1 Principes d'architecture

L'architecture retenue devra privilégier:

- simplicité d'exploitation;
- robustesse transactionnelle;
- séparation claire frontend/backend;
- évolutivité sans refonte majeure;
- observabilité native.

### 11.2 Cible technique recommandée

- Frontend web moderne responsive
- Backend API REST documentée
- Base de données relationnelle PostgreSQL
- Cache ou gestion de sessions adaptée si nécessaire
- Stockage objet pour médias et exports
- Journalisation structurée
- Monitoring et alerting

### 11.3 Environnements

Les environnements suivants sont recommandés:

- développement
- recette / staging
- production

Chaque environnement doit être isolé et configuré séparément.

## 12. Exigences de données

### 12.1 Données principales

Le modèle de données doit au minimum couvrir:

- boutique;
- utilisateur;
- rôle;
- catégorie;
- produit;
- vente;
- ligne de vente;
- mouvement de stock;
- événement d'audit.

### 12.2 Qualité des données

Les règles suivantes sont attendues:

- unicité des identifiants fonctionnels définis;
- intégrité référentielle;
- historisation des opérations critiques;
- horodatage normalisé;
- gestion des statuts actifs/inactifs;
- suppression logique préférée à la suppression physique sur les entités métier sensibles.

### 12.3 Conservation et conformité

La durée de conservation des données, la localisation d'hébergement et les obligations de confidentialité devront être validées selon le pays de déploiement et le cadre légal applicable.

## 13. UX/UI et expérience utilisateur

La conception UX/UI doit être orientée efficacité opérationnelle.

Principes directeurs:

- nombre de clics réduit pour vendre;
- recherche rapide et tolérante;
- messages clairs et non ambigus;
- hiérarchie visuelle simple;
- lisibilité en environnement réel de boutique;
- prise en main rapide pour des utilisateurs non experts.

La cohérence visuelle, la clarté des états système et la prévention d'erreur sont obligatoires pour les écrans critiques.

## 14. Exigences de tests et de recette

### 14.1 Stratégie de test

Le projet devra comporter:

- tests unitaires sur la logique métier critique;
- tests d'intégration API/base de données;
- tests end-to-end sur les parcours principaux;
- tests de sécurité ciblés;
- vérifications d'accessibilité;
- mesures de performance sur les écrans critiques.

### 14.2 Cas de recette prioritaires

Les scénarios suivants devront être validés avant mise en production:

- un caissier se connecte et réalise une vente complète;
- le stock est décrémenté automatiquement après validation;
- un owner ajuste un stock avec motif;
- un caissier ne peut pas modifier un prix sans autorisation;
- une rupture apparaît dans les alertes;
- un rapport journalier reflète les ventes du jour;
- une action sensible est visible dans l'audit.

### 14.3 Go/No-Go

Le passage en production sera conditionné par:

- validation métier formelle;
- absence d'anomalie bloquante;
- conformité des parcours critiques;
- disponibilité du runbook d'exploitation;
- sauvegardes et supervision opérationnelles;
- validation de sécurité minimale sur le périmètre MVP.

## 15. Déploiement et exploitation

### 15.1 Déploiement

Le projet doit prévoir:

- une procédure de livraison industrialisée;
- une configuration par environnement;
- un mécanisme de rollback ou de rétablissement;
- une base de données migrée de manière contrôlée;
- une validation post-déploiement.

### 15.2 Exploitation

L'exploitation devra inclure:

- supervision des erreurs;
- suivi des performances;
- alertes sur disponibilité;
- sauvegardes planifiées;
- vérification périodique de restauration;
- journal d'exploitation minimal.

### 15.3 Support

Un dispositif de support devra être défini avec:

- niveaux de criticité;
- délais de prise en charge;
- canal de remontée;
- responsabilités métier et techniques.

## 16. Gouvernance projet

### 16.1 Organisation recommandée

- Sponsor: porte la vision, arbitre les décisions majeures
- Product Owner: exprime et priorise le besoin métier
- Chef de projet / Delivery: pilote planning, risques, coordination
- Tech Lead: garantit les choix techniques
- QA: garantit la qualité et la stratégie de test
- Référent sécurité/conformité: intervient sur les exigences réglementaires et de sécurité

### 16.2 Cadence projet

Une gouvernance simple mais structurée est recommandée:

- comité projet hebdomadaire;
- revue de backlog régulière;
- revue de recette avant mise en production;
- suivi des risques et décisions ouvertes.

### 16.3 Livrables attendus

- backlog priorisé;
- maquettes validées;
- spécifications fonctionnelles détaillées si nécessaire;
- documentation d'architecture;
- plan de tests;
- procès-verbal de recette;
- runbook d'exploitation;
- dossier de mise en production.

## 17. Planning indicatif

Le planning cible recommandé pour un MVP entreprise est le suivant:

- cadrage et validation du périmètre: 2 semaines
- UX/UI et validation des parcours clés: 2 semaines
- développement frontend/backend et itérations: 6 à 8 semaines
- QA, hardening et recette: 2 à 3 semaines
- déploiement, formation et mise en service: 1 semaine

La durée exacte dépendra du niveau d'exigence, du nombre d'écrans, des arbitrages P0/P1 et des contraintes de conformité.

## 18. Estimation budgétaire

En l'absence d'un budget imposé, trois scénarios peuvent être retenus:

### 18.1 Scénario Lean

MVP strict, équipe réduite, faible profondeur documentaire et exploitation minimale.

### 18.2 Scénario Standard

Option recommandée pour un projet entreprise: couverture fonctionnelle correcte, bonne qualité de livraison, tests sérieux, observabilité et déploiement maîtrisé.

### 18.3 Scénario Robuste

Niveau renforcé pour exploitation plus exigeante: sécurité approfondie, documentation solide, qualité élargie, architecture plus évolutive, meilleures garanties de maintien en condition opérationnelle.

Le chiffrage final devra être réalisé à partir:

- du périmètre validé;
- de l'organisation de l'équipe;
- du mode de réalisation;
- du niveau de qualité attendu;
- des exigences de support et d'hébergement.

## 19. Risques principaux

Les risques structurants du projet sont les suivants:

- périmètre trop large par rapport au délai;
- sous-estimation des règles de stock;
- manque de validation métier des parcours critiques;
- sécurité traitée trop tardivement;
- qualité des données initiales insuffisante;
- flou sur la conformité locale;
- dépendance excessive à une seule personne côté métier.

Mesures de mitigation recommandées:

- figer un MVP réaliste;
- valider rapidement les règles métier;
- mettre les parcours critiques sous tests;
- intégrer sécurité et recette dès le début;
- suivre les risques en comité projet.

## 20. Critères de succès

Le projet sera considéré comme réussi si:

- le parcours de vente est stable et rapide;
- le stock est plus fiable qu'avant le projet;
- le gérant dispose d'indicateurs réellement exploitables;
- les droits d'accès et l'audit couvrent les actions sensibles;
- l'équipe peut maintenir et faire évoluer la solution sans dette majeure bloquante.

## 21. Recommandations finales

Pour positionner le projet à un niveau réellement professionnel, il est recommandé de:

- contractualiser clairement le périmètre MVP;
- formaliser les règles métier sensibles avant développement;
- traiter la sécurité, la traçabilité et l'exploitation comme des exigences de base;
- prévoir une vraie phase de recette terrain;
- préparer dès le MVP les fondations pour les évolutions futures.

## 22. Annexes recommandées à produire ensuite

Le présent CDC peut être complété par les documents suivants:

- backlog détaillé par user stories;
- matrice de rôles et permissions;
- maquettes validées;
- dictionnaire de données détaillé;
- contrat d'API;
- plan de tests détaillé;
- plan de déploiement;
- procédure de support;
- matrice RACI complète.
