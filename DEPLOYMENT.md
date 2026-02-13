# Deploying to GitHub Pages

This guide covers the one-time manual setup needed to deploy the Bible Memory app to GitHub Pages. Once configured, every push to `main` triggers an automatic build and deploy via GitHub Actions.

## Prerequisites

- A GitHub repository (public or private with GitHub Pro)
- A Firebase project with Auth + Firestore enabled (see `FIREBASE_CONNECTION.md`)
- An ESV API key from [api.esv.org](https://api.esv.org/)

## Step 1: Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings > Pages**
3. Under **Build and deployment > Source**, select **GitHub Actions**
4. Click **Save**

## Step 2: Add Repository Secrets

The build needs your Firebase and ESV API credentials. Add each as a repository secret:

1. Go to **Settings > Secrets and variables > Actions**
2. Click **New repository secret** and add each of the following:

| Secret name | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | Your Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | e.g. `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | e.g. `your-project` |
| `VITE_FIREBASE_STORAGE_BUCKET` | e.g. `your-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | e.g. `123456789` |
| `VITE_FIREBASE_APP_ID` | e.g. `1:123456789:web:abcdef` |
| `VITE_ESV_API_KEY` | Your ESV API token |

> **Tip:** The values are the same as your local `.env` file. You can copy them from there.

## Step 3: Authorize the GitHub Pages Domain in Firebase

Firebase Auth blocks sign-in from unauthorized domains. You need to whitelist your GitHub Pages URL.

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication > Settings > Authorized domains**
4. Click **Add domain**
5. Add your GitHub Pages domain: `<your-github-username>.github.io`
6. Click **Add**

Without this step, Google sign-in will fail with a `auth/unauthorized-domain` error.

## Step 4: Push to Deploy

Commit and push to the `main` branch:

```bash
git add -A
git commit -m "Configure GitHub Pages deployment"
git push origin main
```

The GitHub Actions workflow will automatically:
1. Install dependencies
2. Build the app with your secrets injected as environment variables
3. Deploy the `dist/` output to GitHub Pages

Monitor progress in the **Actions** tab of your repository.

## Your Live URL

Once the first deploy completes, the app is available at:

```
https://<your-github-username>.github.io/<repository-name>/
```

## Troubleshooting

### Build fails with missing env vars
Make sure all 7 secrets from Step 2 are added. Go to **Settings > Secrets and variables > Actions** and verify each one exists. Secret values are write-only — you can't view them after saving, but you can update them.

### Blank page or broken assets after deploy
The `BASE_PATH` is set automatically from the repository name. If you renamed the repo, re-run the workflow (go to **Actions > Deploy to GitHub Pages > Run workflow**).

### Google sign-in returns `auth/unauthorized-domain`
Complete Step 3 — add `<username>.github.io` to Firebase's authorized domains list.

### Routes return 404 on page refresh
The workflow copies `index.html` to `404.html` so GitHub Pages serves the SPA shell for any path. If this stops working, check that the `Copy index.html to 404.html` step is present in `.github/workflows/deploy.yml`.

### PWA not installing / no service worker
The app icons (`icon-192.png`, `icon-512.png`) must exist in the `public/` folder. Currently only `favicon.svg` is present — add PNG icons to enable full PWA install support.

## Custom Domain (Optional)

If you want to use a custom domain instead of `github.io`:

1. In **Settings > Pages**, add your custom domain
2. Update the `VITE_FIREBASE_AUTH_DOMAIN` secret (or add the custom domain to Firebase authorized domains)
3. If using an apex domain (no sub-path), you can remove the `BASE_PATH` env var from the workflow — the app will deploy to `/` instead of `/<repo-name>/`
