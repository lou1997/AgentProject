import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5180,
    allowedHosts: ['.monkeycode-ai.online'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
