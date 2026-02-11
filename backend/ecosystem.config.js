/**
 * PM2 Ecosystem Configuration for Hostinger VPS
 * Install PM2: npm install -g pm2
 * Start: pm2 start ecosystem.config.js
 * Save: pm2 save
 * Setup startup: pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'jira-backend',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      autorestart: true,
      max_memory_restart: '500M',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
    },
  ],
};

