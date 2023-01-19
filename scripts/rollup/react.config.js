import { getBaseRollupPlugins, getPackageJson, resolvePackagePath } from './utils';
import generatePackageJson from 'rollup-plugin-generate-package-json';

const { name, module } = getPackageJson('react');
// react 包路径
const packagePath = resolvePackagePath(name);
// react 产物路径
const packageDistPath = resolvePackagePath(name, true);

export default [
	// react
	{
		input: `${packagePath}/${module}`,
		output: {
			file: `${packageDistPath}/index.js`,
			name: 'React',
			format: 'umd'
		},
		plugins: [
			...getBaseRollupPlugins(),
			generatePackageJson({
				inputFolder: packagePath,
				outputFolder: packageDistPath,
				baseContents: ({ name, description, version }) => ({
					name,
					description,
					version,
					main: 'index.js'
				})
			})
		]
	},
	// jsx-runtime
	{
		input: `${packagePath}/src/jsx.ts`,
		output: [
			// jsx-runtime
			{
				file: `${packageDistPath}/jsx-runtime.js`,
				name: 'jsx-runtime',
				format: 'umd'
			},
			// jsx-dev-runtime
			{
				file: `${packageDistPath}/jsx-dev-runtime.js`,
				name: 'jsx-dev-runtime',
				format: 'umd'
			}
		],
		plugins: getBaseRollupPlugins()
	}
];
