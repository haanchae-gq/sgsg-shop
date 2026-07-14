import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { initTheme } from './theme';

// 첫 페인트 **전에** 테마를 정한다. 렌더 뒤에 바꾸면 다크 사용자가 흰 화면을 한 번 본다.
initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
