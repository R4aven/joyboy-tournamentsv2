# JOYBOY TOURNAMENTS — version finale

## 1. Base Supabase

Après le schéma/migrations déjà présents, exécuter dans Supabase SQL Editor :

`sql/migration_final_joyboy.sql`

Cette migration ajoute notamment :
- promos sécurisées et validation atomique ;
- prix original/réduction/prix final par inscription ;
- capacité libre des tournois (2–128) ;
- génération de bracket simple élimination avec byes ;
- synchronisation du bracket ;
- salon 1V1 et anti-absence ;
- sécurité des résultats ;
- stockage privé des preuves de paiement ;
- chemins Storage sûrs pour avatars/preuves ;
- match 1V1 créé après validation des deux paiements.

## 2. Installation locale

```powershell
npm install
npm run dev
```

Variables nécessaires dans `.env.local` selon la configuration Supabase existante :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Ne jamais mettre une clé `service_role` dans le navigateur.

## 3. Vérifications

```powershell
npx tsc --noEmit
npm run build
```

Le typecheck a été validé sur la version livrée. Le build doit être relancé dans un environnement disposant du binaire SWC Linux de Next.js et d'un accès réseau si Next doit télécharger ses dépendances natives.

## 4. Git / GitHub

```powershell
git status
git add .
git commit -m "feat: finalise promos storage notifications brackets et anti-absence"
git push origin main
```

Si Git demande l'identité :

```powershell
git config user.name "Votre Nom"
git config user.email "votre@email.com"
```

## 5. Points importants

- Les noms originaux des fichiers ne servent plus de clés Storage.
- Les preuves de paiement restent privées et sont ouvertes côté admin avec une URL signée.
- Le prix d'inscription normal du tournoi n'est pas modifié par une promo.
- La réduction est recalculée côté serveur et le compteur promo est verrouillé pendant l'inscription.
- Les notifications utilisent leur destination et distinguent les messages ADMIN.
- Le bouton WhatsApp administration utilise le numéro JOYBOY configuré dans le projet.
