import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import replace from '@rollup/plugin-replace';
import { resolvePackagePath } from '../rollup/utils';
import path from 'path';

export default defineConfig({
	plugins: [
		react(),
		replace({
			__DEV__: true,
			preventAssignment: true
		})
	],
	resolve: {
		alias: [
			{
				find: 'react',
				replacement: resolvePackagePath('react')
			},
			{
				find: 'react-dom',
				replacement: resolvePackagePath('react-dom')
			},
			{
				find: 'react-noop-renderer',
				replacement: resolvePackagePath('react-noop-renderer')
			},
			{
				find: 'hostConfig',
				replacement: path.resolve(resolvePackagePath('react-noop-renderer'), './src/hostConfig.ts')
			}
		]
	}
});
