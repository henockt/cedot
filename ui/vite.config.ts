import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const backend = process.env.CORE_URL || 'http://localhost:3000';

export default defineConfig({
  plugins: [svelte()],
  server: {
    // the editor talks to /ws/<id> on its own origin, so it works behind
    // port forwarding / tunnels where :3000 isn't reachable from the browser
    proxy: {
      '/ws': {
        target: backend,
        ws: true,
        rewrite: (path) => path.replace(/^\/ws/, ''),
      },
    },
  },
});
