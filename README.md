# Delivery Back-office (React) — version mock

Back-office d'administration pour Express Delivery, Retours, Karya, Évaluations et Litiges
(spécification MVP v1.0, section 11). Toutes les données sont **statiques / mock** pour le moment.

## Démarrage

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # tests des fonctions pures (transitions, requêtes, notes, i18n)
npm run build    # build de production
```

Compte de démonstration : `admin@delivery.tn` / `Admin123!`

## Fonctionnalités

- Connexion admin, routes protégées, déconnexion
- Tableau de bord (5 compteurs calculés)
- Utilisateurs et prestataires : recherche, filtres, approbation / rejet / suspension (motif obligatoire), désactivation du compte
- Livraisons, Retours, Karya (avec devis), Litiges (note de décision publique/interne), Évaluations (masquer / afficher)
- Pagination, recherche et filtres, états chargement / vide / erreur / réessayer
- Arabe (RTL), français, anglais — langue mémorisée, `dir` appliqué sur `<html>`
- Chaque action admin : confirmation + motif obligatoire, événement ajouté à l'historique, entrée `audit_logs`

## Architecture

```
src/
  domain/        Fonctions PURES (aucun React, aucun I/O) : transitions, listQuery, ratings, stats, format, adminActions
  i18n/          Dictionnaires ar/fr/en + translate() pure
  data/          seed.js (données statiques déterministes) + mockDb.js (store en mémoire)
  services/      backOfficeApi.js : seule couche à remplacer par de vrais appels HTTP
  hooks/         usePaginatedList, useAsync, useDebouncedValue (logique d'état)
  context/       Auth + I18n
  components/
    ui/          Composants 100 % présentationnels et génériques (DataTable, Modal, Pagination…)
    domain/      Composants connectés réutilisables (ResourcePage, StatusActionPanel, ReasonDialog…)
    layout/      Shell, navigation, sélecteur de langue
  pages/         Configuration déclarative (colonnes, filtres) + détail propre à chaque entité
```

Principes appliqués : logique métier dans `domain/` (testable sans UI), composants `ui/` sans
logique, pages = configuration passée à `ResourcePage`. Ajouter une nouvelle ressource = un fichier
de page + une entrée dans `services` et `config/navigation.js`.

## Passer à la vraie API

Réimplémenter les fonctions de `src/services/backOfficeApi.js` avec `fetch('/api/v1/admin/...')`
en gardant les mêmes signatures (`listResource`, `changeStatus`, `changeProviderStatus`,
`getDashboardStats`, `login`). Aucun composant ni page ne change. Le backend reste l'autorité
sur les permissions et transitions : `domain/transitions.js` ne sert qu'à n'afficher que les actions valides.

## Limites connues (mock)

- Pas de filtre par plage de dates ni de tri par colonne dans l'interface (le tri est supporté par `applyQuery`).
- Photos, QR et notifications ne sont pas affichés (données non mockées).
- Session simulée (sessionStorage) : à remplacer par access/refresh tokens.

## Karya — onglet « Livreurs »
- `KaryaPage` = onglets **Demandes** (liste/devis d'origine, inchangée) et **Livreurs** (gestion complète).
- Livreurs : statistiques, recherche, filtre, cartes, détail (approuver/suspendre avec motif + historique) et formulaire « Nouveau livreur ».
- Domaine pur : `domain/couriers.js` (validation, construction du compte, stats). Service : `createCourier`, `getCourierStats` dans `services/backOfficeApi.js` (même signature qu'un futur appel REST).
- Composants réutilisables : `ui/Tabs`, `ui/Avatar`, `ui/Field`, `domain/CourierForm`, `domain/CourierCard`.
- Design : thème moderne clair/sombre, animations (apparition en cascade, survols, modales, spinner), compatible RTL et `prefers-reduced-motion`.
