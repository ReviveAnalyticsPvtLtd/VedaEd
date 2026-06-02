const { createProxyMiddleware } = require("http-proxy-middleware");

/**
 * Only proxy API (and uploads) to the backend.
 * Do NOT use package.json "proxy" — it forwards webpack HMR files and causes ECONNREFUSED noise.
 */
module.exports = function setupProxy(app) {
  const target = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

  app.use(
    "/api",
    createProxyMiddleware({
      target,
      changeOrigin: true,
    })
  );

  app.use(
    "/uploads",
    createProxyMiddleware({
      target,
      changeOrigin: true,
    })
  );
};
