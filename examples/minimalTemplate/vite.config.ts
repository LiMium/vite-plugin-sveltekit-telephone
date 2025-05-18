import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import {telephoneDev} from 'vite-plugin-sveltekit-telephone-dev'

export default defineConfig({
  esbuild: {
    legalComments: 'none',
  },
	plugins: [sveltekit(), telephoneDev.plugin()]
});
