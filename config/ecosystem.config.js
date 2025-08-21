/**
 * PM2 进程管理配置文件
 * 用于生产环境部署和管理
 */

module.exports = {
  apps: [
    {
      name: 'smartvpn-server',
      script: './src/server/index.js',
      env: {
        NODE_ENV: 'server',
        SERVER_HOST: '0.0.0.0',
        SERVER_PORT: 443,
        LOG_LEVEL: 'INFO'
      },
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      log_file: './logs/server-combined.log',
      time: true,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G'
    },
    {
      name: 'smartvpn-client',
      script: './src/client/index.js',
      env: {
        NODE_ENV: 'client',
        SERVER_HOST: '43.159.38.35',
        SERVER_PORT: 443,
        LOG_LEVEL: 'INFO'
      },
      error_file: './logs/client-error.log',
      out_file: './logs/client-out.log',
      log_file: './logs/client-combined.log',
      time: true,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G'
    }
  ],
  
  // 部署配置
  deploy: {
    production: {
      user: 'node',
      host: '43.159.38.35',
      ref: 'origin/main',
      repo: 'git@github.com:OnTheWay0103/smartVPN.git',
      path: '/var/www/smartvpn',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};