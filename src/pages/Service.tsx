import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, Input, Price } from '@sgsg/design/components';
import { api, ApiError, isLoggedIn, type Item, type Site, type SiteQuote } from '../api';
import { uuid } from '../uuid';

/**
 * 현장 문진.
 *
 * 운영 회고: "고객이 서비스를 신청하면 예약이 완료된 것으로 인식하지만, 실제로는
 * 정보가 부족해 다시 상담해야 한다." 그 전화 한 통이 **접수→연락 5~7일**의 출발점이고,
 * 그 지연이 취소와 클레임이 됐다.
 *
 * 그래서 신청할 때 묻는다. 여기서 답한 것이 그대로 **배정 매칭**에 쓰인다 — 4층
 * 엘리베이터 없음이면 그걸 못 올라가는 전문가는 후보에서 내려간다.
 */
const UNIT_TYPES = [
  { v: 'wall', label: '벽걸이' },
  { v: 'stand', label: '스탠드' },
  { v: 'ceiling', label: '천장형' },
  { v: 'system', label: '시스템에어컨' },
];

const won = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`;

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 14px',
        borderRadius: 999,
        border: `1px solid ${on ? 'var(--color-primary-primary-surface)' : 'var(--color-divider-divider)'}`,
        background: on ? 'var(--color-background-primary-elevation-1)' : 'var(--color-background-elevation-1)',
        // 연한 틴트 위의 글자는 primary-text 다. contents-on 은 브랜드 블루 면 위의 흰 글씨다.
        color: on ? 'var(--color-primary-primary-text)' : 'var(--color-contents-contents)',
        fontWeight: on ? 700 : 400,
        font: 'inherit',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

/** 서비스 상세 + 신청. 계약금은 30% 이고, 나머지는 작업이 끝난 뒤 잔금으로 낸다. */
export default function Service() {
  const { id = '' } = useParams();
  const nav = useNavigate();

  const [item, setItem] = useState<Item | null>(null);
  const [addr, setAddr] = useState('');
  const [addr2, setAddr2] = useState('');
  const [when, setWhen] = useState('');
  const [notes, setNotes] = useState('');
  const [site, setSite] = useState<Site>({ 'unit-count': 1, elevator: true, parking: true });
  const [sq, setSq] = useState<SiteQuote | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 답을 고칠 때마다 예상 추가금을 다시 계산한다. 결제 버튼을 누르고 나서 알면 늦다.
  useEffect(() => {
    api.siteQuote(site).then(setSq).catch(() => setSq(null));
  }, [site]);

  useEffect(() => {
    api.item(id).then(setItem).catch(() => setError('서비스를 불러오지 못했어요.'));
  }, [id]);

  // 주문 하나에 키 하나. 결제 버튼을 두 번 눌러도 주문이 두 개 생기면 안 된다.
  //
  // crypto.randomUUID() 를 직접 부르지 않는다 — 보안 컨텍스트(HTTPS/localhost)에서만
  // 존재해서, 평문 HTTP 로 서빙되는 지금은 없다. 그거 하나로 이 화면이 통째로 죽었다.
  const idem = useMemo(() => uuid(), []);

  const deposit = item ? Math.round(item['base-price'] * 0.3) : 0;

  async function submit() {
    if (!isLoggedIn()) {
      // 어디로 돌아올지 기억해 둔다. 로그인하고 나서 홈으로 튕기면 다시 찾아와야 한다.
      sessionStorage.setItem('sgsg.after-login', `/service/${id}`);
      nav('/login');
      return;
    }
    if (!addr.trim()) {
      setError('방문 주소를 입력해 주세요.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const o = await api.placeOrder(
        {
          'service-item-id': id,
          'service-quantity': 1,
          'service-address': { address1: addr.trim(), address2: addr2.trim() },
          'requested-date': when ? new Date(when).toISOString() : undefined,
          'customer-notes': notes.trim() || undefined,
          // 배정 매칭이 이걸 읽는다.
          'site-conditions': site,
        },
        idem,
      );
      nav(`/orders/${o.id}?new=1`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '신청에 실패했어요.');
      setBusy(false);
    }
  }

  if (!item) {
    return (
      <div className="sg-shell sg-pad">
        {error ?? '불러오는 중이에요…'}
      </div>
    );
  }

  return (
    <div className="sg-shell">
      <header className="sg-pad">
        <Button variant="ghost" size="s" onClick={() => nav('/')}>
          ← 서비스 목록
        </Button>
      </header>

      <div className="sg-pad sg-stack">
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{item.name}</h1>
        <div className="sg-muted">{item.description}</div>
        <Price amount={item['base-price']} from />

        <Card>
          <div className="sg-stack">
            <Input
              label="방문 주소"
              placeholder="도로명 주소"
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
            />
            <Input
              label="상세 주소"
              placeholder="동·호수, 출입 방법"
              value={addr2}
              onChange={(e) => setAddr2(e.target.value)}
            />
            <Input
              label="희망 일정"
              type="datetime-local"
              hint="확정은 전문가와 대화로 정합니다."
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
            <Input
              label="요청사항"
              placeholder="예: 반려동물이 있어요"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </Card>

        {/* 현장 문진. 여기서 답한 것이 배정 매칭에 그대로 쓰인다 —
            4층 엘리베이터 없음이면 그걸 못 올라가는 전문가는 후보에서 내려간다. */}
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>현장은 어떤가요?</div>
          <div className="sg-muted" style={{ fontSize: 13, marginBottom: 12 }}>
            미리 알려 주시면 전화로 다시 여쭤보지 않아도 돼요.
          </div>

          <div className="sg-stack">
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>에어컨 종류</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {UNIT_TYPES.map((t) => (
                  <Chip
                    key={t.v}
                    on={site['unit-type'] === t.v}
                    onClick={() => setSite({ ...site, 'unit-type': t.v })}
                  >
                    {t.label}
                  </Chip>
                ))}
              </div>
            </div>

            <Input
              label="대수"
              inputMode="numeric"
              value={String(site['unit-count'] ?? 1)}
              onChange={(e) =>
                setSite({ ...site, 'unit-count': Math.max(1, Number(e.target.value) || 1) })
              }
            />

            <Input
              label="층수"
              inputMode="numeric"
              value={site.floor == null ? '' : String(site.floor)}
              onChange={(e) =>
                setSite({ ...site, floor: e.target.value ? Number(e.target.value) : undefined })
              }
            />

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Chip on={site.elevator === false} onClick={() => setSite({ ...site, elevator: site.elevator === false ? true : false })}>
                엘리베이터 없음
              </Chip>
              <Chip on={site.parking === false} onClick={() => setSite({ ...site, parking: site.parking === false ? true : false })}>
                주차 불가
              </Chip>
              <Chip on={!!site.commercial} onClick={() => setSite({ ...site, commercial: !site.commercial })}>
                상업시설
              </Chip>
              <Chip on={site.ceiling === 'high'} onClick={() => setSite({ ...site, ceiling: site.ceiling === 'high' ? undefined : 'high' })}>
                천장이 높아요
              </Chip>
              <Chip on={site['soil-level'] === 'heavy'} onClick={() => setSite({ ...site, 'soil-level': site['soil-level'] === 'heavy' ? undefined : 'heavy' })}>
                오염이 심해요
              </Chip>
            </div>
          </div>
        </Card>

        <Card>
          <div className="sg-row">
            <span>기본가</span>
            <b>{won(item['base-price'])}</b>
          </div>

          {/* 추가비용을 숨기면 현장에서 싸운다. 결제 전에, 항목별로 보여 준다. */}
          {sq && sq.lines.length > 0 && (
            <>
              {sq.lines.map((l) => (
                <div className="sg-row" key={l.code} style={{ marginTop: 8 }}>
                  <span className="sg-muted">
                    {l.label}
                    {l.qty > 1 ? ` ×${l.qty}` : ''}
                  </span>
                  <span>+{won(l.amount)}</span>
                </div>
              ))}
              <div
                className="sg-row"
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: '1px solid var(--color-divider-divider)',
                }}
              >
                <b>예상 합계</b>
                <b>{won(item['base-price'] + sq.total)}</b>
              </div>
            </>
          )}
          <div className="sg-row" style={{ marginTop: 8 }}>
            <span>지금 낼 계약금 (30%)</span>
            <b>{won(deposit)}</b>
          </div>
          <div className="sg-row" style={{ marginTop: 8 }}>
            <span className="sg-muted">작업 후 낼 잔금</span>
            <span className="sg-muted">{won(item['base-price'] - deposit)}</span>
          </div>
        </Card>

        {/* 추가비용을 숨기면 현장에서 싸운다. 먼저 말한다. */}
        <Alert
          type="info"
          title="현장에서 추가비용이 생길 수 있어요"
          description="전문가가 현장을 보고 알려 드리고, 동의하신 뒤에만 청구됩니다. 동의 없이 늘어나는 금액은 없어요."
        />

        {error && <Alert type="danger" title={error} />}

        <Button variant="primary" size="l" fullWidth loading={busy} onClick={submit}>
          {won(deposit)} 결제하고 신청하기
        </Button>
      </div>
    </div>
  );
}
