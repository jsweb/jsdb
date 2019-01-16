import typescript from 'rollup-plugin-typescript'
import pack from './package.json'

const name = pack.name
const modify = new Date().toJSON().split('.')[0].replace('T', ' ')
const banner = `/**
 * @name ${pack.name}
 * @version ${pack.version}
 * @desc ${pack.description}
 * @author ${pack.author}
 * @create date 2019-01-14 01:37:22
 * @modify date ${modify}
 */`

export default [{
  input: 'src/module.ts',
  plugins: [typescript()],
  external: ['fs', 'path', 'shelljs', '@jsweb/randkey'],
  output: {
    name,
    banner,
    format: 'esm',
    file: 'dist/module.js'
  }
}, {
  input: 'src/module.ts',
  plugins: [typescript()],
  external: ['fs', 'path', 'shelljs', '@jsweb/randkey'],
  output: {
    name,
    banner,
    format: 'cjs',
    file: 'dist/common.js'
  }
}]
