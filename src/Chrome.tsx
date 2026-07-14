import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@sgsg/design/components';
import { isLoggedIn } from './api';
import { COMPANY, SUPPORT } from './content';
import { applyTheme, currentTheme, type Theme } from './theme';

/**
 * 소비자웹의 공통 머리·꼬리.
 *
 * 상단바는 **항상 화면 전체 너비**다. 안쪽 `.sg-wrap` 이 1120px 로 잡는다. 그래서
 * 데스크탑에서도 폰 앱을 늘려 놓은 모양이 되지 않는다.
 */

const THEMES: { key: Theme; label: string; icon: string }[] = [
  { key: 'light', label: '라이트', icon: '☀' },
  { key: 'dark', label: '다크', icon: '☾' },
  { key: 'system', label: '시스템', icon: '⌘' },
];

/** 색을 손으로 고르지 않는다. `data-theme` 을 붙이고 떼면 토큰이 알아서 뒤집힌다. */
export function ThemeToggle() {
  const [t, setT] = useState<Theme>(currentTheme());

  return (
    <div
      role="group"
      aria-label="테마"
      style={{
        display: 'flex',
        gap: 2,
        padding: 2,
        borderRadius: 'var(--rd-8)',
        border: '1px solid var(--color-divider-divider)',
        background: 'var(--color-background-elevation-2)',
        flex: 'none',
      }}
    >
      {THEMES.map((x) => {
        const on = t === x.key;
        return (
          <button
            key={x.key}
            type="button"
            aria-label={x.label}
            aria-pressed={on}
            title={x.label}
            onClick={() => {
              applyTheme(x.key);
              setT(x.key);
            }}
            style={{
              width: 30,
              height: 26,
              borderRadius: 'var(--rd-4)',
              border: 'none',
              cursor: 'pointer',
              font: 'inherit',
              fontSize: 13,
              lineHeight: 1,
              background: on ? 'var(--color-background-primary-elevation-1)' : 'transparent',
              // 연한 틴트 위의 글자는 primary-text 다. contents-on 은 브랜드 블루 면 위의 흰 글씨다.
              color: on
                ? 'var(--color-primary-primary-text)'
                : 'var(--color-contents-contents-sub)',
            }}
          >
            {x.icon}
          </button>
        );
      })}
    </div>
  );
}

const NAV = [
  { to: '/', label: '서비스' },
  { to: '/about', label: '쓱싹 소개' },
];

export function Header() {
  const nav = useNavigate();
  const { pathname } = useLocation();

  return (
    <header className="sg-topbar">
      <div className="sg-wrap sg-topbar__inner">
        <Link to="/" className="sg-topbar__logo">
          <span style={{ fontSize: 20, fontWeight: 800 }}>쓱싹</span>
          {/* 모바일에서는 태그라인을 숨긴다 — 좁은 폭에서 로고와 겹쳐 두 줄이 된다. */}
          <span className="sg-topbar__tag sg-muted" style={{ fontSize: 12 }}>
            양심가격, 안심케어
          </span>
        </Link>

        <nav className="sg-nav">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} aria-current={pathname === n.to ? 'page' : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>

        <ThemeToggle />

        <Button variant="ghost" size="s" onClick={() => nav(isLoggedIn() ? '/orders' : '/login')}>
          {isLoggedIn() ? '내 주문' : '로그인'}
        </Button>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="sg-footer">
      <div className="sg-wrap sg-footer__inner">
        <div style={{ fontWeight: 700, color: 'var(--color-contents-contents)', marginBottom: 6 }}>
          {COMPANY.name}
        </div>
        <div>
          고객센터 {SUPPORT.hours} · {SUPPORT.lunch}
        </div>
        <div>{SUPPORT.email}</div>
        <div style={{ marginTop: 8 }}>
          대표: {COMPANY.ceo} | 통신판매번호: {COMPANY.mailOrderNo} | 사업자등록번호: {COMPANY.bizNo}
        </div>
        <div>{COMPANY.address}</div>
      </div>
    </footer>
  );
}
