import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: 'es2020',
    sourcemap: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // 3D code stays out of the entry: the page renders before three.js arrives
        manualChunks(id) {
          if (id.includes('preload-helper')) return 'react';
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react';
          if (id.includes('node_modules/three/')) return 'three';
          if (/@react-three|three-stdlib|three-mesh-bvh|troika|camera-controls|maath|zustand|its-fine|suspend-react/.test(id)) return 'r3f';
          return undefined;
        },
      },
    },
  },
});
