import { useEffect, useState } from 'react';
import { Alert, Button, Card, Rating } from '@sgsg/design/components';
import { api, ApiError, type Review } from '../api';

/**
 * 리뷰. 구매확정된 주문에만, 한 번.
 *
 * 별점을 조르지 않는다. "좋게 써 주세요" 로 모은 별점은 다음 고객에게 아무것도
 * 알려 주지 못한다.
 */
export default function ReviewForm({ orderId }: { orderId: string }) {
  const [existing, setExisting] = useState<Review>(null);
  const [loaded, setLoaded] = useState(false);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .reviewOf(orderId)
      .then(setExisting)
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [orderId]);

  if (!loaded) return null;

  if (existing) {
    return (
      <Card>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>남겨 주신 리뷰</div>
        <Rating score={existing.rating} count={1} />
        <div style={{ marginTop: 8 }}>{existing.content}</div>
      </Card>
    );
  }

  async function submit() {
    if (rating < 1) {
      setError('별점을 골라 주세요.');
      return;
    }
    if (content.trim().length < 5) {
      setError('리뷰 내용을 5자 이상 적어 주세요.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await api.writeReview(orderId, rating, content.trim());
      setExisting(r as unknown as Review);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '리뷰를 남기지 못했어요.');
      setBusy(false);
    }
  }

  return (
    <Card>
      <div style={{ fontWeight: 700 }}>어떠셨나요?</div>
      <div className="sg-muted" style={{ fontSize: 13, marginBottom: 12 }}>
        솔직하게 적어 주세요. 다음 고객에게 큰 도움이 됩니다.
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`별 ${n}점`}
            aria-pressed={rating === n}
            onClick={() => setRating(n)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 30,
              lineHeight: 1,
              padding: 0,
              color: n <= rating ? '#FAAD14' : 'var(--color-divider-divider)',
            }}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="어떤 점이 좋았는지, 아쉬웠는지 적어 주세요."
        rows={4}
        style={{
          width: '100%',
          padding: 'var(--sp-12)',
          borderRadius: 'var(--rd-16)',
          border: '1px solid var(--color-divider-divider)',
          background: 'var(--color-background-elevation-1)',
          color: 'var(--color-contents-contents)',
          font: 'inherit',
          resize: 'vertical',
        }}
      />

      {error && <div style={{ marginTop: 8 }}><Alert type="danger" title={error} /></div>}

      <div style={{ marginTop: 12 }}>
        <Button variant="primary" fullWidth loading={busy} onClick={submit}>
          리뷰 남기기
        </Button>
      </div>
    </Card>
  );
}
