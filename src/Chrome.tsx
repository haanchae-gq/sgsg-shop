import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@sgsg/design/components';
import { isLoggedIn } from './api';
import { COMPANY, SUPPORT } from './content';
import { applyTheme, currentTheme, type Theme } from './theme';

/**
 * 소비자웹의 공통 머리·꼬리.
 *
 * 전에는 화면마다 자기 헤더를 그렸다. 그래서 테마 스위치를 넣을 자리가 없었고, 로고를
 * 눌러도 홈으로 안 가는 화면이 생겼다. 껍데기를 하나로 모은다.
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
    <header
      className="sg-pad"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-12)',
        borderBottom: '1px solid var(--color-divider-divider)',
      }}
    >
      <Link to="/" style={{ flexShrink: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>쓱싹</div>
        <div className="sg-muted" style={{ fontSize: 12 }}>양심가격, 안심케어</div>
      </Link>

      <nav style={{ display: 'flex', gap: 'var(--sp-12)', marginLeft: 'var(--sp-8)', flex: 1 }}>
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            style={{
              fontSize: 14,
              fontWeight: pathname === n.to ? 700 : 500,
              color:
                pathname === n.to
                  ? 'var(--color-contents-contents)'
                  : 'var(--color-contents-contents-sub)',
            }}
          >
            {n.label}
          </Link>
        ))}
      </nav>

      <ThemeToggle />

      <Button variant="ghost" size="s" onClick={() => nav(isLoggedIn() ? '/orders' : '/login')}>
        {isLoggedIn() ? '내 주문' : '로그인'}
      </Button>
    </header>
  );
}

export function Footer() {
  return (
    <footer
      className="sg-pad"
      style={{
        marginTop: 'var(--sp-32)',
        borderTop: '1px solid var(--color-divider-divider)',
        color: 'var(--color-contents-contents-sub)',
        fontSize: 12,
        lineHeight: 1.7,
      }}
    >
      <div style={{ fontWeight: 700, color: 'var(--color-contents-contents)' }}>
        {COMPANY.name}
      </div>
      <div>고객센터 {SUPPORT.hours} · {SUPPORT.lunch}</div>
      <div>{SUPPORT.email}</div>
      <div style={{ marginTop: 'var(--sp-8)' }}>
        대표: {COMPANY.ceo} | 통신판매번호: {COMPANY.mailOrderNo} | 사업자등록번호: {COMPANY.bizNo}
      </div>
      <div>{COMPANY.address}</div>
    </footer>
  );
}
