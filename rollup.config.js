import typescript from "rollup-plugin-typescript"
import { terser } from "rollup-plugin-terser"

const formats = ["umd", "cjs", "esm"]
const outputs = output => formats.map(format => ({
  ...output,
  format,
  file:
    format === "cjs" ? output.file.replace(".js", ".cjs") :
      format === "esm" ? output.file.replace(".js", ".mjs") :
        output.file
}))

export default {
  input: "./src/index.ts",
  output: outputs({
    file: "dist/bundle/wretch-middlewares.min.js",
    format: "umd",
    name: "wretchMiddlewares",
    sourcemap: true
  }),
  plugins: [
    typescript({
      typescript: require("typescript"),
      importHelpers: true
    }),
    terser()
  ],
  external: ["wretch"]
}