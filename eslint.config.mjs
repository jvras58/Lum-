import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-restricted-syntax": [
        "warn",
        {
          selector: "CallExpression[callee.name=''useEffect''] > ArrowFunctionExpression > BlockStatement > ExpressionStatement > AwaitExpression",
          message: "Avoid async operations inside useEffect. Use RSC or useQuery for data fetching.",
        },
      ],
    },
  },
]

export default config
