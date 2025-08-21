module.exports = {
  apps: [
    {
      name: 'smartvpn-server',
      script: './src/server/index.js',
      cwd: '/home/ubuntu/smartVPN',
      env: {
        NODE_ENV: 'production',
        SERVER_HOST: '0.0.0.0',
        SERVER_PORT: 443,
        TLS_KEY_PATH: './certs/server-key.pem',
        TLS_CERT_PATH: './certs/server-cert.pem',
        LOG_LEVEL: 'INFO'
      },
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      log_file: './logs/server-combined.log',
      time: true
    }
  ]
};