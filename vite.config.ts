import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react()],

  resolve: {
    // @sgsg/design 는 심볼릭 링크된 TS 소스를 그대로 내보내고, react 를 **optional**
    // peer dependency 로 선언한다. 그래서 번들러가 링크된 원본 경로에서 react 를 못
    // 찾고 "없어도 되는 것"으로 취급해 jsx-runtime 을 빈 껍데기로 바꿔 버린다 —
    // 빌드가 "jsx is not exported" 로 죽는 이유가 그것이다.
    //
    // 우리 react 하나를 가리키게 못박는다. (근본 해결은 디자인 가이드에서 react 를
    // optional 이 아닌 peer dependency 로 선언하는 것이다 — 컴포넌트 라이브러리에서
    // react 는 있어도 그만인 의존이 아니다.)
    dedupe: ['react', 'react-dom'],
    alias: [
      { find: /^react$/, replacement: here('node_modules/react') },
      { find: /^react\/jsx-runtime$/, replacement: here('node_modules/react/jsx-runtime') },
      { find: /^react\/jsx-dev-runtime$/, replacement: here('node_modules/react/jsx-dev-runtime') },
      { find: /^react-dom$/, replacement: here('node_modules/react-dom') },
    ],
  },

  // 백엔드로 프록시한다. 다른 오리진으로 직접 부르면 CORS 허용 목록에 포트를 하나씩
  // 더해야 하고, 그 목록은 배포마다 어긋난다.
  //
  // `preview` 에도 같은 프록시가 필요하다 — dev 서버의 설정은 preview 에 상속되지
  // 않아서, 빌드된 앱을 띄우면 API 호출이 전부 index.html 을 받아 온다.
  server: {
    host: true,
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: true } },
  },

  preview: {
    host: true,
    port: 5174,
    proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: true } },
  },
});
