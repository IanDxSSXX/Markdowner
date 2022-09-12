import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import css from "rollup-plugin-import-css";
import dts from "rollup-plugin-dts";

const packageJson = require("./dist/package.json");

const rollupDefault = [{
    input: 'src/base/index.ts',
    output: {
        file: 'dist/index.js',
        format: 'esm'
    },
    plugins: [
        typescript({tsconfig: "tsconfig.json"}),
        commonjs(),
        nodeResolve(),
        css()
    ],
    external: Object.keys(packageJson.dependencies)
},
{
    input: 'src/base/index.ts',
    output: {
        file: 'dist/index.d.ts',
        format: "esm"
    },
    plugins: [
        dts()
    ]
}]

export default rollupDefault