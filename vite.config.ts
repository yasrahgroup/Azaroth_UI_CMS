import fs from 'fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'copy-static-media',
        apply: 'build',
        closeBundle() {
          const distPath = path.resolve(import.meta.dirname, 'dist');
          fs.cpSync(
            path.resolve(import.meta.dirname, 'src/assets/images'),
            path.join(distPath, 'assets/images'),
            { recursive: true }
          );
          fs.cpSync(
            path.resolve(import.meta.dirname, 'uploads'),
            path.join(distPath, 'uploads'),
            { recursive: true }
          );
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      // Specifically ignore data persistence directory and uploaded assets so CMS writes don't trigger page reloads.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: [
          '**/data/**',
          '**/uploads/**',
          '**/.git/**',
          '**/dist/**',
          '**/*.log',
        ],
      },
    },
  };
});
