import obsidianmd from "eslint-plugin-obsidianmd";

export default [
	{
		ignores: ["node_modules/**", "main.js", "misc/**", "changelog/**"],
	},
	...obsidianmd.configs.recommended,
	{
		files: ["**/*.ts"],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		// Build tooling runs in Node, not in Obsidian.
		files: ["esbuild.config.mjs", "version-bump.mjs"],
		languageOptions: {
			globals: { process: "readonly" },
		},
		rules: {
			"obsidianmd/no-nodejs-modules": "off",
		},
	},
];
