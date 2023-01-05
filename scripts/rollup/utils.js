import path from 'path';
import fs from 'fs';

import ts from 'rollup-plugin-typescript2';
import cjs from '@rollup/plugin-commonjs';

const packagePath = path.resolve(__dirname, '../../packages');
const distPath = path.resolve(__dirname, '../../dist/node_modules');

export function resolvePackagePath(packageName, isDist) {
	// 是否是打包产物的路径
	if (isDist) {
		return `${distPath}/${packageName}`;
	}
	return `${packagePath}/${packageName}`;
}

export function getPackageJson(packageName) {
	const path = `${resolvePackagePath(packageName)}/package.json`;
	const str = fs.readFileSync(path, { encoding: 'utf-8' });
	return JSON.parse(str);
}

export function getBaseRollupPlugins({ typescript = {} } = {}) {
	return [cjs(), ts(typescript)];
}
