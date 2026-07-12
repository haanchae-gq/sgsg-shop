import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Empty, JobStatusDot, Skeleton } from '@sgsg/design/components';
import { api, type Order } from '../api';

const won = (n: number) => `${Math.round(n ?? 0).toLocaleString('ko-KR')}원`;

/**
 * 백엔드의 10개 주문 상태를 디자인 시스템의 6개 상태로 옮긴다.
 *
 * 운영의 어휘를 고객에게 그대로 보여 주면 안 된다 — '미배정'은 고객에게 아무 뜻이
 * 없다. 고객이 알고 싶은 건 "내 일이 지금 어디까지 왔나" 하나다.
 *
 * 라벨은 `JobStatusDot` 이 정한다 (JOB_STATUS_LABEL). 여기서 문구를 또 만들면
 * 전문가앱과 소비자웹이 같은 상태를 다르게 부르게 된다.
 */
export type JobStatus = 'pending' | 'matched' | 'working' | 'done' | 'canceled' | 'issue';

export function jobStatusOf(o: Order): JobStatus {
  if (o.status === 'cancelled' || o.status === 'refunded') return 'canceled';
  if (o.status === 'purchase-confirmed') return 'done';
  if (o.status === 'service-completed') return 'done';
  if (o.status === 'expert-in-progress') return 'working';
  if (o.status === 'assigned') return 'matched';
  return 'pending';
}

/** 이 주문에서 고객이 지금 해야 할 일. 없으면 null. */
export function todoOf(o: Order): string | null {
  if (o['payment-status'] === 'pending') return '계약금을 결제해 주세요';
  if (o.status === 'service-completed' && o.cost['unpaid-amount'] > 0)
    return '잔금을 결제해 주세요';
  return null;
}

export default function Orders() {
  const nav = useNavigate();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    api.myOrders().then(setOrders).catch(() => setOrders([]));
  }, []);

  return (
    <div className="sg-shell">
      <header className="sg-pad sg-row">
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>내 주문</h1>
        <Button variant="ghost" size="s" onClick={() => nav('/')}>
          서비스 보기
        </Button>
      </header>

      <div className="sg-pad sg-stack">
        {!orders && <Skeleton height="90px" />}

        {orders?.length === 0 && (
          <Empty
            title="아직 주문이 없어요."
            description="필요한 서비스를 골라 보세요."
            action={<Button variant="primary" onClick={() => nav('/')}>서비스 둘러보기</Button>}
          />
        )}

        {orders?.map((o) => {
          const todo = todoOf(o);
          return (
            <Card key={o.id} onClick={() => nav(`/orders/${o.id}`)} style={{ cursor: 'pointer' }}>
              <div className="sg-row">
                <div>
                  <div style={{ fontWeight: 700 }}>{o['service-name'] ?? '서비스'}</div>
                  <div className="sg-muted" style={{ fontSize: 13 }}>
                    {o['order-number']?.value}
                  </div>
                </div>
                <JobStatusDot status={jobStatusOf(o)} />
              </div>
              <div className="sg-row" style={{ marginTop: 12 }}>
                {/* 해야 할 일이 있으면 그것부터 말한다. 금액은 그 다음이다. */}
                <span className={todo ? '' : 'sg-muted'} style={todo ? { fontWeight: 600 } : undefined}>
                  {todo ?? '남은 금액'}
                </span>
                <b>
                  {o['payment-status'] === 'pending'
                    ? won(o.cost['deposit-amount'])
                    : won(o.cost['unpaid-amount'])}
                </b>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
