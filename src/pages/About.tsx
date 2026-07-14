import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@sgsg/design/components';
import { Footer, Header } from '../Chrome';
import { BRAND, EXPERT_VOICES, GUARANTEES, NOTICES, QUOTE_NOTE, STATS } from '../content';

/**
 * 쓱싹 소개.
 *
 * 회사가 이미 쓰고 있는 카피를 그대로 옮겼다(`content.ts`). 여기서 하는 일은 **약속을
 * 먼저 보여 주는 것**이다: 처음 온 사람이 가장 먼저 묻는 것은 "얼마예요" 가 아니라
 * "덤터기 안 씌워요?" 다.
 */
export default function About() {
  const nav = useNavigate();

  return (
    <div className="sg-shell">
      <Header />

      {/* 히어로 */}
      <section
        className="sg-pad"
        style={{ background: 'var(--color-background-primary-elevation-1)' }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--color-primary-primary-text)',
          }}
        >
          {BRAND.tagline}
        </div>
        <h1
          style={{
            fontSize: 24,
            lineHeight: 1.4,
            fontWeight: 800,
            margin: '8px 0 0',
            whiteSpace: 'pre-line',
          }}
        >
          {BRAND.hero}
        </h1>

        <div style={{ display: 'flex', gap: 'var(--sp-20)', marginTop: 'var(--sp-20)' }}>
          {STATS.map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{s.value}</div>
              <div className="sg-muted" style={{ fontSize: 12 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="sg-pad sg-stack">
        {/* 보장 서비스 — 우리가 고객에게 하는 약속 */}
        <section>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: '4px 0 12px' }}>
            쓱싹만의 보장 서비스
          </h2>
          <div className="sg-stack">
            {GUARANTEES.map((g) => (
              <Card key={g.title}>
                <div style={{ fontWeight: 700 }}>{g.title}</div>
                <div className="sg-muted" style={{ marginTop: 4, fontSize: 13 }}>{g.body}</div>
              </Card>
            ))}
          </div>
        </section>

        {/* 전문가 */}
        <section>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: '16px 0 4px' }}>
            정직과 실력, 쓱싹 전문가들
          </h2>
          <p className="sg-muted" style={{ margin: '0 0 12px' }}>
            불신으로 가득했던 가전 시장에서, 이 사람들이 우리의 답입니다.
          </p>
          <div className="sg-stack">
            {EXPERT_VOICES.map((e) => (
              <Card key={e.name}>
                <div style={{ fontWeight: 700, lineHeight: 1.5 }}>“{e.quote}”</div>
                <div className="sg-muted" style={{ marginTop: 6, fontSize: 13 }}>{e.body}</div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--color-primary-primary-text)',
                  }}
                >
                  {e.name} 전문가
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* 견적 안내 */}
        <section>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: '16px 0 8px' }}>견적 안내</h2>
          <Card>
            <div style={{ fontSize: 14, lineHeight: 1.7 }}>{QUOTE_NOTE}</div>
          </Card>
        </section>

        {/* 유의사항 — 주문 전에 읽혀야 하는 것 */}
        <section>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: '16px 0 8px' }}>
            서비스 전체 유의사항
          </h2>
          <Card>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.8 }}>
              {NOTICES.map((n) => (
                <li key={n} style={{ color: 'var(--color-contents-contents-sub)' }}>{n}</li>
              ))}
            </ul>
          </Card>
        </section>

        <Button onClick={() => nav('/')} style={{ marginTop: 'var(--sp-8)' }}>
          서비스 보러가기
        </Button>
      </div>

      <Footer />
    </div>
  );
}
