import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Card, Empty, Price, Skeleton } from '@sgsg/design/components';
import { api, type StoreItem } from '../api';

/**
 * 스토어 — 헤이홈 몰(위사 입점몰)에서 파는 확정가 서비스.
 *
 * 소비자웹에는 길이 둘이다. 여기는 **가격이 정해진 것들**이고, 결제는 헤이홈 몰이
 * 받는다. 우리가 결제창을 다시 만들면 돈이 두 군데서 움직이고, 그러면 어느 쪽이
 * 진실인지 아무도 모르게 된다.
 *
 * 카탈로그(`/`)는 다른 길이다 — 현장에서 견적이 정해지는 일들.
 */
export default function Store() {
  const nav = useNavigate();
  const [items, setItems] = useState<StoreItem[] | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .store()
      .then((d) => {
        setEnabled(d.enabled);
        setItems(d.items);
      })
      .catch(() => setError('서비스를 불러오지 못했어요.'));
  }, []);

  return (
    <div className="sg-shell">
      <header className="sg-pad">
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>바로 신청</h1>
        <p className="sg-muted" style={{ marginTop: 4 }}>
          가격이 정해진 서비스예요. 몇 가지만 답하시면 금액이 바로 나옵니다.
        </p>
      </header>

      <div className="sg-pad sg-stack">
        {error && <Alert type="danger" title={error} />}

        {!enabled && (
          <Empty
            title="지금은 신청할 수 없어요."
            description="잠시 후 다시 시도해 주세요."
          />
        )}

        {!items && !error && (
          <>
            <Skeleton height="88px" />
            <Skeleton height="88px" />
          </>
        )}

        {items?.map((it) => (
          <Card
            key={it.pno}
            onClick={() => nav(`/store/${it.pno}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className="sg-row">
              <div>
                <div style={{ fontWeight: 700 }}>{it.name}</div>
                {it.description && (
                  <div className="sg-muted" style={{ fontSize: 13, marginTop: 2 }}>
                    {it.description}
                  </div>
                )}
              </div>
              {/* 옵션에 따라 올라간다. 확정가처럼 보이면 안 된다. */}
              <Price amount={it.price} from />
            </div>
          </Card>
        ))}

        {items?.length === 0 && enabled && (
          <Empty title="아직 등록된 서비스가 없어요." description="곧 찾아뵐게요." />
        )}
      </div>
    </div>
  );
}
