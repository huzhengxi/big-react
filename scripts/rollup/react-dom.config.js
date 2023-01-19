import { getBaseRollupPlugins, getPackageJson, resolvePackagePath } from './utils';
import generatePackageJson from 'rollup-plugin-generate-package-json';
import alias from '@rollup/plugin-alias';

const { name, module, peerDependencies } = getPackageJson('react-dom');
// react-dom 包路径
const packagePath = resolvePackagePath(name);
// react-dom 产物路径
const packageDistPath = resolvePackagePath(name, true);

export default [
	// react-dom
	{
		input: `${packagePath}/${module}`,
		output: [
			{
				file: `${packageDistPath}/index.js`,
				name: 'ReactDOM',
				format: 'umd'
			},
			{
				file: `${packageDistPath}/client.js`,
				name: 'client',
				format: 'umd'
			}
		],
		external: [...Object.keys(peerDependencies)],
		plugins: [
			...getBaseRollupPlugins(),
			alias({
				entries: {
					hostConfig: `${packagePath}/src/hostConfig.ts`
				}
			}),
			generatePackageJson({
				inputFolder: packagePath,
				outputFolder: packageDistPath,
				baseContents: ({ name, description, version }) => ({
					name,
					description,
					version,
					peerDependencies: {
						react: version
					},
					main: 'index.js'
				})
			})
		]
	},
	// test-utils
	{
		input: `${packagePath}/test-utils.ts`,
		output: [
			{
				file: `${packageDistPath}/test-utils.js`,
				name: 'testUtils',
				format: 'umd'
			}
		],
		external: ['react', 'react-dom'],
		plugins: [
			...getBaseRollupPlugins(),
			alias({
				entries: {
					hostConfig: `${packagePath}/src/hostConfig.ts`
				}
			}),
			generatePackageJson({
				inputFolder: packagePath,
				outputFolder: packageDistPath,
				baseContents: ({ name, description, version }) => ({
					name,
					description,
					version,
					peerDependencies: {
						react: version
					},
					main: 'index.js'
				})
			})
		]
	}
];
