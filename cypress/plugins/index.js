import wp from '@cypress/webpack-preprocessor';

const plugin = (on) => {
  const options = {
    webpackOptions: {
      resolve: {
        extensions: ['.ts', '.js'],
      },
      module: {
        rules: [
          {
            test: /\.ts$/,
            loader: 'ts-loader',
            options: { transpileOnly: true },
          },
        ],
      },
    },
  };

  on('file:preprocessor', wp(options))
};

export default plugin;
