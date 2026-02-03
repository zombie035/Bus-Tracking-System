module.exports = {
  webpack: {
    plugins: {
      remove: ['ESLintWebpackPlugin'],
    }
  },
  devServer: {
    allowedHosts: 'all',
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws'
    },
    setupMiddlewares: (middlewares, devServer) => middlewares,
  },
  eslint: {
    enable: false
  }
};
