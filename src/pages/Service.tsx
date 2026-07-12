import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, Input, Price } from '@sgsg/design/components';
import { api, ApiError, isLoggedIn, type Item } from '../api';

const won = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`;

/** 서비스 상세 + 신청. 계약금은 30% 이고, 나머지는 작업이 끝난 뒤 잔금으로 낸다. */
export default function Service() {
  const { id = '' } = useParams();
  const nav = useNavigate();

  const [item, setItem] = useState<Item | null>(null);
  const [addr, setAddr] = useState('');
  const [addr2, setAddr2] = useState('');
  const [when, setWhen] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.item(id).then(setItem).catch(() => setError('서비스를 불러오지 못했어요.'));
  }, [id]);

  // 주문 하나에 키 하나. 결제 버튼을 두 번 눌러도 주문이 두 개 생기면 안 된다.
  const idem = useMemo(() => crypto.randomUUID(), []);

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

        <Card>
          <div className="sg-row">
            <span>기본가</span>
            <b>{won(item['base-price'])}</b>
          </div>
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
