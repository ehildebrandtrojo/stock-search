import { sveltekit } from '@sveltejs/kit/vite';

const config = {
	ssr: {
		noExternal: ['chart.js/**']
	},
	plugins: [sveltekit()]
};

export default config;
