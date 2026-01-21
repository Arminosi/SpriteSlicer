import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 自动获取 GitHub 仓库名，例如 "user/repo-name" -> "/repo-name/"
  const repoName = process.env.GITHUB_REPOSITORY 
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/` 
    : '/';

  return {
    // 生产环境使用仓库名，开发环境使用根路径
    base: mode === 'production' ? repoName : '/',
    
    plugins: [react()],
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    // 建议显式指定打包输出目录为 dist
    build: {
      outDir: 'dist',
    }
  };
})
