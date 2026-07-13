import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, Skeleton } from '@sgsg/design/components';
import { api, ApiError, type Handoff, type Question } from '../api';

const won = (n: number) => `${Math.round(n ?? 0).toLocaleString('ko-KR')}원`;

/**
 * 문진 → 견적 → 컨펌.
 *
 * **문항을 우리가 만들지 않았다.** 헤이홈 몰 상품의 옵션 세트가 그대로 문진이다.
 * 우리가 따로 만들었으면 가격을 두 군데서 관리하게 되고, 고객이 본 견적과 청구된
 * 금액이 달라지는 날이 온다.
 *
 * 견적도 우리가 계산하지 않는다. 서버가 몰의 추가금을 더해서 보여 줄 뿐이고, 진짜
 * 금액은 몰이 만든다.
 */
export default function StoreQuote() {
  const { pno = '' } = useParams();
  const nav = useNavigate();

  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [name, setName] = useState('');
  const [base, setBase] = useState(0);
  const [picked, setPicked] = useState<Record<number, number>>({}); // opno → items-no
  const [handoff, setHandoff] = useState<Handoff | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const n = Number(pno);
    Promise.all([api.questions(n), api.store()])
      .then(([q, s]) => {
        setQuestions(q.questions);
        const it = s.items.find((x) => x.pno === n);
        setName(it?.name ?? '서비스');
        setBase(it?.price ?? 0);
      })
      .catch(() => setError('서비스를 불러오지 못했어요.'));
  }, [pno]);

  const choices = useMemo(() => Object.values(picked), [picked]);

  // 화면에서도 더해 보여 준다. 서버가 같은 값을 낸다 — 다르면 서버(=몰)가 맞다.
  const extra = useMemo(() => {
    if (!questions) return 0;
    let sum = 0;
    for (const q of questions) {
      const c = q.choices.find((x) => x['items-no'] === picked[q.opno]);
      if (c) sum += c['add-price'];
    }
    return sum;
  }, [questions, picked]);

  const answered = questions?.filter((q) => q.required).every((q) => picked[q.opno] != null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      setHandoff(await api.confirm(Number(pno), choices));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '신청하지 못했어요.');
    } finally {
      setBusy(false);
    }
  }

  if (!questions) {
    return (
      <div className="sg-shell sg-pad">
        {error ? <Alert type="danger" title={error} /> : <Skeleton height="200px" />}
      </div>
    );
  }

  // 컨펌했다. 결제는 헤이홈 몰에서 한다.
  if (handoff) {
    return (
      <div className="sg-shell">
        <div className="sg-pad sg-stack">
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>결제만 남았어요</h1>

          <Card>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{handoff.name}</div>
            <div className="sg-row">
              <span className="sg-muted">고르신 옵션</span>
              <b>{handoff.selected.join(' · ')}</b>
            </div>
            <div className="sg-row" style={{ marginTop: 8 }}>
              <span className="sg-muted">예상 금액</span>
              <b>{won(handoff.total)}</b>
            </div>
          </Card>

          {/* 여기서 정직해야 한다. 몰에서 옵션을 한 번 더 골라야 하고, 그 이유를
              숨기면 고객은 우리가 실수한 줄 안다. */}
          <Alert
            type="info"
            title="헤이홈 몰에서 결제해 주세요"
            description={`결제는 헤이홈 몰에서 진행됩니다. 상품 페이지에서 '${handoff.selected.join(
              ' · ',
            )}'을 똑같이 골라 주세요.`}
          />

          <Button
            variant="primary"
            size="l"
            fullWidth
            onClick={() => {
              window.location.href = handoff['buy-url'];
            }}
          >
            헤이홈 몰에서 결제하기
          </Button>

          <Button variant="ghost" fullWidth onClick={() => setHandoff(null)}>
            옵션 다시 고르기
          </Button>

          <p className="sg-muted" style={{ fontSize: 13 }}>
            결제가 끝나면 전문가를 배정해 드립니다. 진행 상황은 '내 일정'에서 확인하실 수 있어요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="sg-shell">
      <header className="sg-pad">
        <Button variant="ghost" size="s" onClick={() => nav('/store')}>
          ← 목록
        </Button>
      </header>

      <div className="sg-pad sg-stack">
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{name}</h1>

        {questions.map((q) => (
          <Card key={q.opno}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>
              {q.label}
              {q.required && <span style={{ color: 'var(--color-individuals-danger)' }}> *</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {q.choices.map((c) => {
                const on = picked[q.opno] === c['items-no'];
                return (
                  <button
                    key={c['items-no']}
                    type="button"
                    onClick={() => setPicked({ ...picked, [q.opno]: c['items-no'] })}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      borderRadius: 'var(--rd-16)',
                      border: `1px solid ${
                        on ? 'var(--color-primary-primary-surface)' : 'var(--color-divider-divider)'
                      }`,
                      background: on
                        ? 'var(--color-background-primary-elevation-1)'
                        : 'var(--color-background-elevation-1)',
                      color: 'var(--color-contents-contents)',
                      font: 'inherit',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontWeight: on ? 700 : 400 }}>{c.label}</span>
                    <span className="sg-muted">
                      {c['add-price'] > 0 ? `+${won(c['add-price'])}` : '추가금 없음'}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        ))}

        <Card>
          <div className="sg-row">
            <span className="sg-muted">기본가</span>
            <span>{won(base)}</span>
          </div>
          <div className="sg-row" style={{ marginTop: 8 }}>
            <span className="sg-muted">옵션 추가금</span>
            <span>{extra > 0 ? `+${won(extra)}` : '없음'}</span>
          </div>
          <div
            className="sg-row"
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid var(--color-divider-divider)',
            }}
          >
            <b>예상 금액</b>
            <b>{won(base + extra)}</b>
          </div>
        </Card>

        {/* 추가비용을 숨기면 현장에서 싸운다. 먼저 말한다. */}
        <Alert
          type="info"
          title="현장에서 추가비용이 생길 수 있어요"
          description="전문가가 현장을 보고 알려 드리고, 동의하신 뒤에만 청구됩니다. 동의 없이 늘어나는 금액은 없어요."
        />

        {error && <Alert type="danger" title={error} />}

        <Button
          variant="primary"
          size="l"
          fullWidth
          loading={busy}
          disabled={!answered}
          onClick={confirm}
        >
          {answered ? `${won(base + extra)} 신청하기` : '옵션을 골라 주세요'}
        </Button>
      </div>
    </div>
  );
}
