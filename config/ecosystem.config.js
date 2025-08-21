module.exports = {
  apps: [
    {
      name: 'smartvpn-server',
      script: './src/server/index.js',
      env: {
        NODE_ENV: 'production',
        SERVER_HOST: '0.0.0.0',
        SERVER_PORT: 443,
        LOG_LEVEL: 'INFO'
      },
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      log_file: './logs/server-combined.log',
      time: true
    },
    {
      name: 'smartvpn-client',
      script: './src/client/index.js',
      env: {
        NODE_ENV: 'production',
        REMOTE_HOST: 'localhost',  // 修改为实际服务器IP
        REMOTE_PORT: 443,
        LOG_LEVEL: 'INFO'
      },
      error_file: './logs/client-error.log',
      out_file: './logs/client-out.log',
      log_file: './logs/client-combined.log',
      time: true
    }
  ]
};