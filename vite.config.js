import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

export default defineConfig(({ command, mode }) => {
  // Load .env.production to get all VITE_ variables
  let envVars = {};
  const envFilePath = path.resolve(__dirname, `.env.${mode}`);
  if (fs.existsSync(envFilePath)) {
    const envContent = fs.readFileSync(envFilePath, 'utf-8');
    const lines = envContent.split('\n');
    lines.forEach(line => {
      const [key, value] = line.split('=');
      if (key && key.trim().startsWith('VITE_')) {
        envVars[key.trim()] = value ? value.trim() : '';
      }
    });
  }

  // Build the define object dynamically for all VITE_ variables
  const defineVars = {};
  Object.entries(envVars).forEach(([key, value]) => {
    defineVars[`import.meta.env.${key}`] = JSON.stringify(value);
  });

  return {
    plugins: [react()],
    server: {
      port: 8080
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: defineVars
  }
})