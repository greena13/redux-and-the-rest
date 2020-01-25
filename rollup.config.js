import babel from 'rollup-plugin-babel';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';
import license from 'rollup-plugin-license';
import path from 'path';

export default {
  input: 'src/index.js',

  output: {
    format: 'cjs',
    file: process.env.NODE_ENV === 'production' ? 'cjs/redux-and-the-rest.production.min.js' : 'cjs/redux-and-the-rest.development.js',
    exports: 'named'
  },
  external: [
    'query-string',
    'pluralize'
  ],
  plugins: [
    babel({
      exclude: 'node_modules/**'
    }),

    replace({
      exclude: 'node_modules/**',
      ENV: JSON.stringify(process.env.NODE_ENV || 'development')
    }),

    (process.env.NODE_ENV === 'production' && terser()),

    license({
      banner: {
        content: {
          file: path.join(__dirname, 'LICENSE')
        }
      }
    })
  ]
};
