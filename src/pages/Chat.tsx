import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card } from '@sgsg/design/components';
import { api } from '../api';

type Msg = { id: string; content: string; 'sender-type': string; 'created-at': string };

/**
 * 전문가와의 대화.
 *
 * 대화는 **배정될 때 서버가 연다** — 소비자웹은 대화 id 를 모르고 주문 id 만 안다.
 * 아직 없으면 조용히 아무것도 그리지 않는다: "대화가 없습니다" 는 고객에게
 * 알려 줄 것이 없는 문장이다.
 */
export default function Chat({ orderId }: { orderId: string }) {
  const [convId, setConvId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (id: string) => {
    // 읽어 가면 서버가 읽음 처리한다. 스레드를 가져간 클라이언트는 정의상 그걸 본 것이다.
    const d = await api.messages(id);
    setMsgs(((d as any).messages ?? []) as Msg[]);
  }, []);

  useEffect(() => {
    let alive = true;
    api.conversationFor(orderId).then((c) => {
      if (!alive || !c) return;
      setConvId(c.id);
      load(c.id).catch(() => setError('대화를 불러오지 못했어요.'));
    });
    return () => {
      alive = false;
    };
  }, [orderId, load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [msgs.length]);

  if (!convId) return null;

  async function send() {
    const body = text.trim();
    if (!body || !convId) return;
    setBusy(true);
    setError(null);
    try {
      await api.sendMessage(convId, body);
      setText('');
      await load(convId);
    } catch {
      // 메시지는 큐에 넣지 않는다. 보낸 줄 알았는데 안 갔다면 그게 더 나쁘다.
      setError('메시지를 보내지 못했어요. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>전문가와의 대화</div>

      <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex',
                    flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {msgs.length === 0 && (
          <div className="sg-muted" style={{ fontSize: 14 }}>
            궁금한 점을 물어보세요. 전문가가 답해 드려요.
          </div>
        )}
        {msgs.map((m) => {
          const mine = m['sender-type'] === 'customer';
          return (
            <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--rd-16)',
                  background: mine
                    ? 'var(--color-primary-primary-surface)'
                    : 'var(--color-background-elevation-2)',
                  color: mine ? '#fff' : 'var(--color-contents-contents)',
                  fontSize: 15,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {error && <div style={{ color: 'var(--color-individuals-danger)', fontSize: 13,
                              marginBottom: 8 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8 }}>
        {/* 디자인 시스템의 <Input> 은 라벨이 필수다 (접근성). 채팅 입력줄 위에
            라벨을 띄우는 화면은 없으니, 토큰으로 칠한 input 에 aria-label 을 준다. */}
        <input
          aria-label="메시지"
          placeholder="메시지를 입력하세요"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // 한글 입력 중 Enter 는 조합을 확정하는 키다. 여기서 보내면 글자가 잘린다.
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void send();
            }
          }}
          style={{
            flex: 1,
            padding: 'var(--sp-12)',
            borderRadius: 'var(--rd-16)',
            border: '1px solid var(--color-divider-divider)',
            background: 'var(--color-background-elevation-1)',
            color: 'var(--color-contents-contents)',
            font: 'inherit',
          }}
        />
        <Button variant="primary" loading={busy} onClick={send}>
          보내기
        </Button>
      </div>
    </Card>
  );
}
