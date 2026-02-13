# Testing on Your Phone

## Prerequisites

- Your phone and computer must be on the **same Wi-Fi network**.
- Node.js v20 installed (`nvm use 20`).

## 1. Start the dev server on your local network

By default, Vite only listens on `localhost`, which your phone can't reach. Use the `--host` flag to expose it on your local IP:

```bash
npm run dev -- --host
```

Vite will print output like:

```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

The **Network** URL is the one you'll open on your phone.

## 2. Open the URL on your phone

1. Copy the `Network` URL from the terminal (e.g. `http://192.168.1.42:5173/`).
2. Open it in your phone's browser (Safari on iOS, Chrome on Android).

> **Tip:** If typing the URL is tedious, generate a QR code from your terminal:
>
> ```bash
> # macOS — install qrencode via Homebrew
> brew install qrencode
> qrencode -t ANSI "http://192.168.1.42:5173/"
> ```
>
> Then scan the QR code with your phone camera.

## 3. Test as a PWA (Add to Home Screen)

Since this is a Progressive Web App, you'll want to test the installed experience:

- **iOS (Safari):** Tap the Share button → "Add to Home Screen"
- **Android (Chrome):** Tap the three-dot menu → "Add to Home screen" or "Install app"

> **Note:** PWA service workers require HTTPS in production, but Vite's dev server over plain HTTP works for basic testing. The service worker won't register over HTTP, so install/offline behavior should be verified with a production build (see section 5).

## 4. Debugging

### iOS (Safari)

1. Connect your phone to your Mac via USB.
2. On your iPhone, go to **Settings → Safari → Advanced → Web Inspector → On**.
3. On your Mac, open Safari → **Develop** menu → select your iPhone → select the page.
4. You now have a full Safari DevTools inspector for the page on your phone.

### Android (Chrome)

1. Enable **USB Debugging** on your Android device (Settings → Developer Options).
2. Connect your phone to your computer via USB.
3. On your computer, open Chrome and go to `chrome://inspect`.
4. Your device and open tabs will appear — click **Inspect** to open DevTools.

## 5. Testing a production build on your phone

To test the full PWA experience (service worker, offline mode, install prompt):

```bash
npm run build
npm run preview -- --host
```

This serves the production build on your local network. Open the **Network** URL on your phone just like before. The service worker will register over this local connection, so you can test offline behavior and the install prompt.

## Troubleshooting

| Problem | Fix |
|---|---|
| Phone can't reach the URL | Make sure both devices are on the same Wi-Fi. Check that no firewall is blocking port 5173. |
| Page loads but is blank / errors | Open the browser console (see Debugging above) to check for errors. Ensure your `.env` file has valid Firebase and ESV API keys. |
| HMR (hot reload) not working on phone | HMR uses WebSockets. Some networks block them. Try refreshing manually, or restart the dev server. |
| "Add to Home Screen" not available | This requires HTTPS. Use `npm run preview -- --host` with the production build for PWA install testing. |
