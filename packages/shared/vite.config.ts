import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: {
      types: 'src/types/index.ts',
    },
    dts: true,
    minify: true,
    exports: true,
  },
});
