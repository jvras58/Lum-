module.exports = {
  extends: ["next/core-web-vitals", "next/typescript"],
  rules: {
    "no-restricted-syntax": [
      "warn",
      {
        selector: "CallExpression[callee.name='useEffect'] > ArrowFunctionExpression > BlockStatement > ExpressionStatement > AwaitExpression",
        message: "Avoid async operations inside useEffect. Use React Server Components or useQuery for data fetching.",
      },
    ],
  },
}
