module.exports = {
  apps: [
    {
      name: 'game-backend',
      cwd: './backend',
      script: 'dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'game-frontend',
      cwd: './frontend',
      script: 'npx',
      args: 'serve -s dist -l 5173',
      env_production: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'ai-worker',
      cwd: './backend',
      script: 'dist/jobs/aiWorker.js',
      instances: 1,
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
