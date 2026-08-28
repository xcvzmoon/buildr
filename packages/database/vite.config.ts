import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    dts: true,
    minify: true,
    exports: true,
  },
});
