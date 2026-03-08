const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    // Proxy API requests
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'http://localhost:5000',
            changeOrigin: true,
        })
    );

    // Proxy WebSocket requests
    app.use(
        createProxyMiddleware('/socket.io', {
            target: 'http://localhost:5000',
            changeOrigin: true,
            ws: true, // Enable WebSocket proxying
        })
    );
};
