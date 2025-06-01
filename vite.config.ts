import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
	plugins: [react()],
	server: {
		port: 3000,
		open: true,
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@assets': path.resolve(__dirname, './src/assets'),
			'@common': path.resolve(__dirname, './src/common'),
			'@components': path.resolve(__dirname, './src/components'),
			'@interfaces': path.resolve(__dirname, './src/interfaces'),
			'@decorators': path.resolve(__dirname, './src/decorators'),
			'@utilities': path.resolve(__dirname, './src/utilities'),
			'@services': path.resolve(__dirname, './src/services'),
			'@classes': path.resolve(__dirname, './src/classes'),
			'@helpers': path.resolve(__dirname, './src/helpers'),
			'@context': path.resolve(__dirname, './src/context'),
			'@styles': path.resolve(__dirname, './src/styles'),
			'@hooks': path.resolve(__dirname, './src/hooks'),
			'@types': path.resolve(__dirname, './src/types'),
		},
	},
})
