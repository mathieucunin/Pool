# Lancer PoolCare en développement (macOS)

Projet **Expo (React Native + TypeScript)**. Ce guide cible **macOS** et l'exécution sur
**Android (Android Studio)**, avec une note iOS en fin de page.

## 1. Prérequis (à installer une fois)

Avec [Homebrew](https://brew.sh) :

```bash
# Node.js (LTS) + outils utiles
brew install node watchman

# Android Studio (inclut le SDK et un JDK embarqué)
brew install --cask android-studio
```

Puis ouvre **Android Studio** une première fois :

1. *More Actions → SDK Manager* → onglet **SDK Platforms** : coche une plateforme récente
   (ex. Android 14). Onglet **SDK Tools** : coche **Android SDK Platform-Tools** et
   **Android Emulator**. Applique.
2. *More Actions → Virtual Device Manager → Create Device* : choisis un téléphone
   (ex. **Pixel 7**), une image système (ex. **API 34**), termine. Tu pourras le démarrer avec ▶︎.

### Variables d'environnement (shell `zsh` par défaut sur macOS)

Ajoute ceci à `~/.zshrc`, puis `source ~/.zshrc` :

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator
```

Vérifie : `adb --version` doit répondre.

> **JDK : il faut Java 17** (React Native/Expo ne supportent pas les JDK très récents).
> Si `java -version` affiche autre chose que 17.x :
> ```bash
> brew install --cask zulu@17
> echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
> source ~/.zshrc
> java -version   # doit afficher 17.x
> ```

## 2. Installer les dépendances du projet

```bash
cd Pool
npm install
npx expo install --fix   # aligne les versions natives sur le SDK Expo
```

## 3. Lancer l'app

### Option A — Expo Go (le plus rapide, sans build natif)

```bash
npx expo start
```

Démarre l'émulateur (Android Studio → *Virtual Device Manager → ▶︎*), puis dans le terminal Expo
**appuie sur `a`** : Expo Go s'installe sur l'émulateur et ouvre le projet.

Pratique pour itérer, mais **les notifications locales sont limitées dans Expo Go sur Android**.
Pour les tester pleinement, utilise l'option B.

### Option B — Build natif (recommandé : caméra + notifications complètes)

```bash
npx expo run:android
```

Génère le dossier `android/` (projet Gradle), le compile et l'installe sur l'émulateur démarré
(ou un téléphone branché en USB avec *débogage USB* activé). Le serveur Metro démarre tout seul.

Pour piloter le build natif **depuis Android Studio** :
*File → Open* → sélectionne le dossier **`Pool/android`** (pas la racine) → laisse Gradle
synchroniser → bouton ▶︎ **Run**.

> Le dossier `android/` est volontairement gitignoré : il se régénère avec
> `npx expo run:android`, inutile de le committer.

## 4. (Bonus) iOS, puisque tu es sur Mac

```bash
# Xcode requis (App Store), puis :
sudo xcodebuild -license accept
brew install cocoapods
npx expo run:ios        # build natif sur le simulateur iOS
# ou simplement : npx expo start  puis touche « i »
```

## Dépannage rapide

| Souci | Solution |
|------|----------|
| `adb` introuvable | Vérifie `ANDROID_HOME` et `source ~/.zshrc` |
| `Unsupported class file major version` (build Gradle) | Mauvaise version de Java : installe JDK 17 et règle `JAVA_HOME` (voir section Prérequis) |
| `npm install` erreur de registre | N'arrive que dans le sandbox cloud ; en local, ça fonctionne |
| Émulateur lent | Active l'accélération matérielle, ou teste sur un vrai téléphone |
| Cache Metro corrompu | `npx expo start -c` |
| Versions natives incohérentes | `npx expo install --fix` |
