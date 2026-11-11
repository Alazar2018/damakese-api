/** PM2 — API only. From the API repo root: pm2 start scripts/deploy/ecosystem.config.cjs */
const path = require("path");

const root = path.join(__dirname, "..", "..");

module.exports = {
  apps: [
    {
      name: "damakese-api",
      cwd: root,
      script: "dist/main.js",
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production" },
      max_memory_restart: "500M",
    },
  ],
};
