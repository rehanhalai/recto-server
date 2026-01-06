import tseslint from "typescript-eslint";
import js from "@eslint/js";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  {
    ignores: ["dist/", "node_modules/", "public/", "docs/"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error",
    },
  },
];
