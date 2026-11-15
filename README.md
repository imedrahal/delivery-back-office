# Delivery Back-office (React)

Back-office d'administration pour Express Delivery, Retours, Karya, Évaluations et Litiges
(spécification MVP v1.0, section 11). L'authentification et les indicateurs du tableau de bord utilisent l'API Livra ;
les autres données métier restent simulées.

## Démarrage

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # tests des fonctions pures (transitions, requêtes, notes, i18n)
npm run build    # build de production
```

En local, le front appelle `http://localhost:3000/api/v1/auth/login`. Configurez `VITE_API_BASE_URL`
si l'API est hébergée ailleurs (par exemple `https://api.example.com/api/v1`). Le compte administrateur
doit être créé/configuré côté backend.

Sur Vercel, si `VITE_API_BASE_URL` pointe vers `localhost`, `127.0.0.1` ou `::1`, le login et le tableau
de bord passent automatiquement en mode démo : `demo@livra.local` / `Demo123!`. Les indicateurs utilisent
les données d'exemple locales et sont signalés comme fictifs. L'application exécutée en local continue
d'appeler l'API locale. Si le déploiement Vercel utilise un domaine personnalisé non détecté automatiquement,
ajoutez `VITE_DEPLOYMENT_PLATFORM=vercel` à ses variables d'environnement. Une URL d'API distante conserve
l'authentification réelle et les indicateurs API, y compris sur Vercel.

## Fonctionnalités

- Connexion admin, routes protégées, déconnexion
- Tableau de bord dynamique (livraisons ouvertes/en cours, retours ouverts, transporteurs actifs/inactifs et litiges ouverts)
- Interface responsive desktop, tablette et mobile avec navigation latérale en tiroir sur mobile
- Menus déroulants personnalisés accessibles au clavier, tactiles et compatibles RTL
- Clients et livreurs chargés depuis l'API admin, avec recherche, filtres et pagination ; activation / désactivation des comptes
- Livraisons, Retours, Karya, Litiges et évaluations des livreurs
- Pagination, recherche et filtres, états chargement / vide / erreur / réessayer
- Arabe (RTL), français, anglais — langue mémorisée, `dir` appliqué sur `<html>`
- Chaque action admin : confirmation + motif obligatoire, événement ajouté à l'historique, entrée `audit_logs`

## Architecture

```
src/
  domain/        Fonctions PURES (aucun React, aucun I/O) : transitions, listQuery, ratings, stats, format, adminActions
  i18n/          Dictionnaires ar/fr/en + translate() pure
  data/          seed.js (données statiques déterministes) + mockDb.js (store en mémoire)
  services/      backOfficeApi.js : connexion et indicateurs API ou démo ; autres ressources simulées
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

## API

La connexion appelle `POST /auth/login` avec `{ identifier, password }`. Le champ `identifier` accepte
un e-mail ou un numéro de téléphone. Les tokens et l'utilisateur renvoyés par le backend sont gardés
en session. Seuls les comptes dont le rôle est `admin` peuvent accéder au back-office.
Le tableau de bord utilise les listes admin paginées `/deliveries`, `/returns` et `/disputes`, ainsi que
`/admin/transporters`. Les compteurs de livraisons incluent `requested` (ouvertes) et `accepted`/`picked_up`
(en cours) ; les retours ouverts incluent `requested`, `accepted` et `picked_up`. Le backend actuel gère un annuaire
Karya sans demandes de devis : les deux cartes Karya affichent donc les transporteurs actifs et inactifs.
Les sections clients et livreurs utilisent `/admin/users` (rôles `customer` et `provider`), `/admin/providers`
pour les informations véhicule/permis, et `PATCH /admin/users/:id` avec `{ active }` pour activer ou désactiver
un compte. Les livreurs affichés correspondent donc aux comptes `provider` du backend. Le reste des ressources
métier utilise encore les données simulées. En mode démo Vercel, les utilisateurs et leurs actions utilisent aussi
les données locales.
La page Livraisons utilise `GET /deliveries` et `GET /deliveries/:id` : elle adapte les statuts et champs
camelCase de l'API au modèle d'affichage, et charge l'historique depuis le détail à l'ouverture de la fiche.
La fiche affiche les champs de livraison persistés et les informations associées, sans les indicateurs calculés.
Les filtres de statut sont transmis à l'API (sans l'option « offre au coursier préféré ») ; la recherche et la
pagination sont appliquées aux résultats récupérés. Le mode démo conserve les livraisons locales.
Les fixtures du mode démo suivent également les champs actuellement affichés pour les livraisons
(adresses, destinataire, colis, montants, dates et historique) et les profils coursiers
(véhicule, zone et permis), afin que les pages récentes restent utilisables sans API.
La page Évaluations utilise `GET /admin/users?role=provider` et les champs `ratingAvg`/`ratingCount` pour
afficher la note moyenne de chaque livreur. Elle n'affiche pas les notes des clients ni les avis détaillés.
La base PostgreSQL locale contient six évaluations de démonstration attachées à des livraisons terminées,
identifiées par les références `RATING-DEMO-*` (moyennes vérifiées : 4,67 et 4,00).

## Limites connues

- Pas de filtre par plage de dates ni de tri par colonne dans l'interface (le tri est supporté par `applyQuery`).
- Photos, QR et notifications ne sont pas affichés (données non mockées).
- Les données métier restent en mémoire et ne sont pas encore connectées à l'API.

## Karya — onglet « Livreurs »
- `KaryaPage` = onglets **Demandes** (liste/devis d'origine, inchangée) et **Livreurs** (gestion complète).
- Livreurs : statistiques, recherche, filtre, cartes, détail (approuver/suspendre avec motif + historique) et formulaire « Nouveau livreur ».
- Domaine pur : `domain/couriers.js` (validation, construction du compte, stats). Service : `createCourier`, `getCourierStats` dans `services/backOfficeApi.js` (même signature qu'un futur appel REST).
- Composants réutilisables : `ui/Tabs`, `ui/Avatar`, `ui/Field`, `domain/CourierForm`, `domain/CourierCard`.
- Design : thème moderne clair/sombre, animations (apparition en cascade, survols, modales, spinner), compatible RTL et `prefers-reduced-motion`.
