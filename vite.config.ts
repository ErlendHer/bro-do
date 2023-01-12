import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';

const config: UserConfig = {
	plugins: [sveltekit()],
	optimizeDeps: {
		exclude: [
			'firebase',
			'firebase/app',
			'firebase/auth',
			'firebase/firestore',
			'firebase/analytics'
		]
	}
};
export default config;
