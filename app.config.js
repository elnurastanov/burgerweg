// Dynamic part of the Expo config (everything else is in app.json).
// EXPO_PUBLIC_BASE_PATH is the site's path prefix, e.g. "/burgerweg" for https://example.com/burgerweg.
// scripts/build-site.mjs derives it from SITE_URL; it is empty for a site at the domain root and in development.
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...config.experiments, baseUrl: `${process.env.EXPO_PUBLIC_BASE_PATH ?? ''}/app` },
});
