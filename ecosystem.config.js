module.exports = {
  apps: [
    {
      name: "awake-backend",
      script: "./server/src/server.js",
      cwd: "./",
      instances: 1,
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "1G",
      
      // Production environment
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      
      // Load environment variables from .env.production
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      
      // Error and output log files
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      
      // Restart settings
      min_uptime: "10s",
      max_restarts: 10,
      autorestart: true,
      
      // Shutdown settings
      kill_timeout: 5000,
      wait_ready: true,
    },
    {
      name: "awake-frontend",
      script: "npm",
      args: "run preview",
      cwd: "./",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
      env_production: {
        NODE_ENV: "production",
      },
      error_file: "./logs/frontend-err.log",
      out_file: "./logs/frontend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
