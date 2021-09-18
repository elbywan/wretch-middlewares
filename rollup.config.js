import typescript from "rollup-plugin-typescript"
import { terser } from "rollup-plugin-terser"

export default {
    input: "./src/index.ts",
    output: {
        file: "dist/umd/wretch-middlewares.min.js",
        format: "umd",
        name: "wretchMiddlewares",
        sourcemap: true
    },
    plugins: [
        typescript({
            typescript: require("typescript"),
            importHelpers: true
        }),
        terser()
    ],
    external: [ "wretch" ]
}