# PoolCare 🏊

Application mobile **iOS & Android** d'aide à l'entretien de piscine, construite avec
[Expo](https://expo.dev) (React Native + TypeScript).

## Fonctionnalités

- **Profil piscine** ⚙️ — type de bassin (enterrée, hors-sol, spa), volume calculé d'après la
  forme et les dimensions (modifiable), type de filtration, mode de désinfection (chlore,
  électrolyse au sel, brome, oxygène actif) et **type d'analyseur d'eau** (bandelettes,
  photomètre, trousse à gouttes, sonde connectée).
- **Moteur de plan d'action** 🧠 (`src/lib/treatment.ts`) — à partir des mesures et du profil,
  génère un plan **priorisé dans l'ordre chimique correct** (stabilisant bloquant → TAC → pH →
  désinfectant → rattrapage algues/clarification → confort) avec **dosages calculés sur le
  volume du bassin** (pH±, TAC+, chlore choc, stabilisant, sel, anti-algues…), consignes
  d'attente entre étapes, et recommandations adaptées : plages de pH spécifiques à
  l'électrolyse, pas de floculant sur filtre à cartouche/diatomées, pas de stabilisant au brome,
  séquestrant avant chloration sur eau ferrugineuse, etc. Chaque étape propose le produit
  correspondant à ajouter au panier.
- **Saisie des mesures (manuel ou photo)** 📋 — saisissez les valeurs à la main (photomètre,
  trousse à gouttes, sonde — mis en avant automatiquement selon l'analyseur configuré) **ou**
  pré-remplissez-les par photo de bandelette : la lecture colorimétrique renseigne les champs,
  que vous pouvez corriger avant de générer le plan.

- **Analyse de la couleur de l'eau par photo** 📷 — photographiez la surface de l'eau :
  l'app mesure la couleur moyenne (teinte/saturation) et pose un diagnostic
  (eau claire, trouble, laiteuse, verte/algues, brune/métaux) avec les actions recommandées.
- **Lecture de bandelette de test par photo** 🧪 — guide de cadrage à l'écran, lecture des
  5 pastilles (dureté TH, chlore libre, pH, alcalinité TAC, stabilisant CYA) par comparaison
  colorimétrique avec un référentiel, statut par paramètre (trop bas / OK / trop haut) et conseils.
- **Routines & rappels** 🗓️ — routines d'entretien prédéfinies ou personnalisées
  (tester l'eau, galet de chlore, contre-lavage…), échéances calculées automatiquement et
  **notifications locales** la veille de chaque action.
- **Stock de produits** 📦 — inventaire avec seuils d'alerte « stock bas ».
- **Boutique** 🛒 — catalogue de produits d'entretien, panier, commande (simulée pour cette
  version) ; à réception, la commande incrémente automatiquement le stock.
- **Historique des analyses** sur le tableau de bord et l'onglet Analyse.

Toutes les données sont stockées **localement** sur l'appareil (AsyncStorage) — aucun compte requis.

## Démarrage

```bash
npm install
npx expo install --fix   # aligne les versions natives sur le SDK Expo installé
npx expo start
```

Puis scannez le QR code avec **Expo Go** (iOS/Android), ou lancez un simulateur avec `i` / `a`.

> 💡 Pour les notifications sur Android et un comportement caméra fidèle, préférez un
> **development build** : `npx expo run:android` / `npx expo run:ios`.

## Architecture

```
app/                     Écrans (expo-router, file-based routing)
  (tabs)/                Onglets : Accueil, Analyse, Routines, Stock
  analyse/eau.tsx        Capture + diagnostic couleur de l'eau
  analyse/bandelette.tsx Capture guidée + lecture bandelette
  analyse/manuelle.tsx   Saisie des mesures (photomètre, gouttes, sonde)
  piscine.tsx            Profil du bassin (volume, filtration, désinfection, analyseur)
  routine/nouvelle.tsx   Création de routine (modèles ou personnalisée)
  boutique.tsx           Catalogue, panier, commandes
src/
  lib/imagePixels.ts     Décodage JPEG → pixels, couleur moyenne, HSV, distance couleur
  lib/waterAnalysis.ts   Classification de l'eau + diagnostics/actions
  lib/stripAnalysis.ts   Référentiel colorimétrique 5-en-1 + lecture des pads
  lib/treatment.ts       Moteur de plan d'action priorisé et dosé selon le profil
  lib/notifications.ts   Rappels locaux (expo-notifications)
  store/useAppStore.ts   État global persisté (zustand + AsyncStorage)
  data/products.ts       Catalogue boutique
```

### Comment marche l'analyse photo ?

La photo est réduite (expo-image-manipulator) puis décodée en pixels (jpeg-js, pur JS, aucun
module natif requis). Pour l'eau : couleur moyenne de la zone centrale convertie en HSV puis
classée par règles de teinte/saturation. Pour la bandelette : couleur moyenne de chaque zone du
guide, comparée au référentiel par distance perceptuelle (« redmean »), valeur du pad la plus proche.

**Limites connues (v1)** : la lecture dépend de l'éclairage et de la marque de bandelette — l'app
l'indique à l'utilisateur et recommande de confirmer avec l'échelle du flacon. Pistes
d'amélioration : calibration via une charte de blanc, détection automatique de la bandelette,
modèle de vision dédié.

### Évolutions envisagées

- Backend (comptes, synchronisation multi-appareils, vraie boutique e-commerce)
- Volume du bassin pour calculer les dosages exacts de produits
- Météo locale pour adapter les recommandations (orage, canicule)
- Notifications push serveur et historique graphique des mesures
