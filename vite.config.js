import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps asset paths relative, so the build works at danyll39.github.io/drink-finder/
export default defineConfig({
  plugins: [react()],
  base: './',
});
