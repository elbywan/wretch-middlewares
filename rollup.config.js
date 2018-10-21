import typescript from "rollup-plugin-typescript"
import { uglify } from "rollup-plugin-uglify"

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
        uglify()
    ],
    external: [ "wretch" ]
}