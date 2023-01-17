import { getBaseRollupPlugins, getPackageJson, resolvePackagePath } from './utils';
import generatePackageJson from 'rollup-plugin-generate-package-json';
import alias from '@rollup/plugin-alias';

const { name, module } = getPackageJson('react-dom');
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
				name: 'index.js',
				format: 'umd'
			},
			{
				file: `${packageDistPath}/client.js`,
				name: 'client.js',
				format: 'umd'
			}
		],
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
