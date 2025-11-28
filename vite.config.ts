import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env': {
          API_KEY: env.GEMINI_API_KEY,
          GEMINI_API_KEY: env.GEMINI_API_KEY,
          MEM0_API_KEY: env.MEM0_API_KEY || "m0-w4JvmXiUIbquFhH107n7nXYdGNU68XOvhaKDKJ7q"
        }
      },
      resolve: {
        alias: {
          '@': path.resolve('.'),
        }
      }
    };
});
