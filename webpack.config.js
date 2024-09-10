const path = require('path');

module.exports = {
	entry: './src/js/main.js',
	output: {
		filename: 'main.js',
		path: path.resolve(__dirname, 'public/js'),
	},
	mode: 'development',
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env'],
					},
				},
			},
		],
	},
	devtool: 'source-map',
};
