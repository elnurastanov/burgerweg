// Dynamic part of the Expo config (everything else is in app.json).
// EXPO_PUBLIC_BASE_PATH is the site's path prefix, e.g. "/burgerweg" for https://example.com/burgerweg.
// scripts/build-site.mjs derives it from SITE_URL; it is empty for a site at the domain root and in development.
// EXPO_PUBLIC_WEB_APP_URL (e.g. https://example.com/burgerweg/app) is where transfer QR codes point; Android
// claims <that>/transfer links (App Links) so a scanned code opens the installed app instead of the browser.
const webApp = process.env.EXPO_PUBLIC_WEB_APP_URL ? new URL(process.env.EXPO_PUBLIC_WEB_APP_URL) : null;

module.exports = ({ config }) => ({
  ...config,
  experiments: { ...config.experiments, baseUrl: `${process.env.EXPO_PUBLIC_BASE_PATH ?? ''}/app` },
  android: {
    ...config.android,
    intentFilters: webApp
      ? [
          {
            action: 'VIEW',
            autoVerify: true,
            data: [{ scheme: 'https', host: webApp.host, pathPrefix: `${webApp.pathname.replace(/\/+$/, '')}/transfer` }],
            category: ['BROWSABLE', 'DEFAULT'],
          },
        ]
      : [],
  },
});
