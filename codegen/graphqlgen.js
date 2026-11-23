const path = require('path')

const schema = process.env.TRIP2G_SCHEMA || path.resolve(__dirname, '../../trip2g/internal/graph/schema.graphqls')

module.exports = {
	generates: {
		'./': {
			schema,
			preset: require('./preset.js'),
			plugins: [],
			documents: ['ui/**/*.graphql'],
			config: {
				molPackage: 'trip2gtasks',
				molRoot: 'ui',
				namingConvention: 'keep',
				inlineFragmentTypes: 'mask',
				scalars: { Int64: 'number', Time: 'string', JSON: 'unknown', Upload: 'unknown', Map: 'Record<string, unknown>' },
				revalidation: 'all',
				molRuntime: '$trip2gtasks_gql',
				molSchemaTypes: 'ui/gql/schema.graphql.ts',
			},
		},
	},
}
