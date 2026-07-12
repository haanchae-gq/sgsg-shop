import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Button, Card, JobSteps, JobStatusDot } from '@sgsg/design/components';
import { api, ApiError, type Order } from '../api';
import { jobStatusOf, todoOf } from './Orders';
import Chat from './Chat';
import ReviewForm from './ReviewForm';

const won = (n: number) => `${Math.round(n ?? 0).toLocaleString('ko-KR')}원`;

/** 고객이 보는 진행 단계. 전문가앱의 5단계(배정·출발·도착·작업·완료)와는 다르다 —
 *  고객에게 '출발'과 '도착'은 하나의 일("오고 있다")이다. */
const STEPS = ['접수', '전문가 배정', '작업', '완료'];

function stepIndex(o: Order): number {
  if (o.status === 'purchase-confirmed') return 3;
  if (o.status === 'service-completed' || o.status === 'expert-in-progress') return 2;
  if (o.status === 'assigned') return 1;
  return 0;
}

export default function OrderDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const justOrdered = params.get('new') === '1';

  const [o, setOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .myOrder(id)
      .then(setOrder)
      .catch((e) => setError(e instanceof ApiError ? e.message : '주문을 불러오지 못했어요.'));
  }, [id]);

  useEffect(load, [load]);

  async function payDeposit() {
    setBusy(true);
    setError(null);
    try {
      await api.payDeposit(id);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '결제에 실패했어요.');
    } finally {
      setBusy(false);
    }
  }

  if (!o) {
    return <div className="sg-shell sg-pad">{error ?? '불러오는 중이에요…'}</div>;
  }

  const todo = todoOf(o);
  const needsDeposit = o['payment-status'] === 'pending';
  const done = o.status === 'purchase-confirmed';

  return (
    <div className="sg-shell">
      <header className="sg-pad sg-row">
        <Button variant="ghost" size="s" onClick={() => nav('/orders')}>
          ← 내 주문
        </Button>
        <JobStatusDot status={jobStatusOf(o)} />
      </header>

      <div className="sg-pad sg-stack">
        {justOrdered && needsDeposit && (
          <Alert
            type="info"
            title="신청이 접수되었어요"
            description="계약금을 결제하면 전문가를 찾기 시작합니다."
          />
        )}

        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{o['service-name']}</h1>
          <div className="sg-muted" style={{ fontSize: 13 }}>{o['order-number']?.value}</div>
        </div>

        <Card>
          <JobSteps steps={STEPS} current={stepIndex(o)} />
        </Card>

        <Card>
          <div className="sg-row">
            <span className="sg-muted">기본가</span>
            <span>{won(o.cost['base-price'])}</span>
          </div>
          {o.cost['total-amount'] !== o.cost['base-price'] && (
            <div className="sg-row" style={{ marginTop: 8 }}>
              {/* 현장 추가비용. 동의한 것만 여기 올라온다. */}
              <span className="sg-muted">현장 추가비용</span>
              <span>{won(o.cost['total-amount'] - o.cost['base-price'])}</span>
            </div>
          )}
          <div className="sg-row" style={{ marginTop: 8 }}>
            <span className="sg-muted">낸 금액</span>
            <span>{won(o.cost['paid-amount'])}</span>
          </div>
          <div className="sg-row" style={{ marginTop: 12, paddingTop: 12,
                                          borderTop: '1px solid var(--color-divider-divider)' }}>
            <b>남은 금액</b>
            <b>{won(o.cost['unpaid-amount'])}</b>
          </div>
        </Card>

        {error && <Alert type="danger" title={error} />}

        {todo && (
          <Button variant="primary" size="l" fullWidth loading={busy}
                  onClick={needsDeposit ? payDeposit : undefined}
                  disabled={!needsDeposit}>
            {needsDeposit
              ? `계약금 ${won(o.cost['deposit-amount'])} 결제하기`
              : /* 잔금은 전문가가 요청을 보내야 결제창이 열린다 — 금액이 현장에서
                   정해지기 때문이다. 고객이 먼저 아무 금액이나 낼 수는 없다. */
                '잔금 결제 요청을 기다리는 중이에요'}
          </Button>
        )}

        {/* 대화는 전문가가 배정된 뒤에 열린다. 배정 전에는 대화할 상대가 없다. */}
        {o.status !== 'new' && !needsDeposit && <Chat orderId={o.id} />}

        {done && <ReviewForm orderId={o.id} />}
      </div>
    </div>
  );
}
