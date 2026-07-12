import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Empty, ServiceCard, Skeleton } from '@sgsg/design/components';
import { api, isLoggedIn, type Category } from '../api';

/**
 * 디자인 시스템의 카테고리는 넷뿐이다 — 사이트의 실제 분류이고, 새로 지어내면 안
 * 된다(`ServiceCategory`). DB 의 카테고리 slug 를 거기에 맞춘다. 모르는 분류는
 * '수리'로 떨어뜨린다: 틀린 아이콘이 붙는 것이 화면이 깨지는 것보다 낫다.
 */
type SgCategory = 'install' | 'cleaning' | 'unclog' | 'repair';

function toSgCategory(slug?: string): SgCategory {
  switch (slug) {
    case 'cleaning': return 'cleaning';
    case 'install':
    case 'moving':   return 'install';
    case 'unclog':   return 'unclog';
    default:         return 'repair';
  }
}

/** 홈. 로그인 없이 본다 — 처음 온 사람이 가격조차 못 보면 아무도 주문하지 않는다. */
export default function Catalog() {
  const nav = useNavigate();
  const [cats, setCats] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .catalog()
      .then((d) => setCats(d.categories))
      .catch(() => setError('서비스를 불러오지 못했어요.'));
  }, []);

  return (
    <div className="sg-shell">
      <header className="sg-pad sg-row">
        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>쓱싹</div>
          <div className="sg-muted">양심가격, 안심케어</div>
        </div>
        <Button
          variant="ghost"
          size="s"
          onClick={() => nav(isLoggedIn() ? '/orders' : '/login')}
        >
          {isLoggedIn() ? '내 주문' : '로그인'}
        </Button>
      </header>

      <div className="sg-pad sg-stack">
        {error && <Empty title={error} description="잠시 후 다시 시도해 주세요." />}

        {!cats && !error && (
          <div className="sg-stack">
            <Skeleton height="80px" />
            <Skeleton height="80px" />
            <Skeleton height="80px" />
          </div>
        )}

        {cats?.map((c) => (
          <section key={c.id} style={{ marginBottom: 8 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '4px 0 12px' }}>{c.name}</h2>
            {c.items.length === 0 ? (
              <div className="sg-muted">준비 중이에요.</div>
            ) : (
              <div className="sg-stack">
                {c.items.map((it) => (
                  <ServiceCard
                    key={it.id}
                    name={it.name}
                    category={toSgCategory(c.slug)}
                    description={it.description}
                    // 현장 상황에 따라 추가비용이 붙는다. 확정가처럼 보이면 안 된다.
                    priceFrom={it['base-price']}
                    onClick={() => nav(`/service/${it.id}`)}
                  />
                ))}
              </div>
            )}
          </section>
        ))}

        {cats?.length === 0 && (
          <Empty title="아직 등록된 서비스가 없어요." description="곧 찾아뵐게요." />
        )}
      </div>

      <footer className="sg-pad sg-muted" style={{ fontSize: 12 }}>
        '~' 가 붙은 금액은 기본가입니다. 현장 상황에 따라 추가비용이 발생할 수 있고,
        추가비용은 전문가가 현장에서 알려 드리고 동의를 받은 뒤에만 청구됩니다.
      </footer>
    </div>
  );
}
