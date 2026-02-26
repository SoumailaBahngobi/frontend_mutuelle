const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Auth endpoints go to port 8081
  app.use(
    '/mutuelle/auth',
    createProxyMiddleware({
      target: 'http://localhost:8081',
      changeOrigin: true,
      secure: false
    })
  );

  // All other backend calls to port 8080
  app.use(
    '/mutuelle',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
      secure: false
    })
  );
};