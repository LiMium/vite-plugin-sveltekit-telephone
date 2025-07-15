import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { telephoneDev } from 'vite-plugin-sveltekit-telephone-dev';

export default defineConfig({
  plugins: [sveltekit(), telephoneDev.plugin()]
});
