import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@sgsg/design/components';
import { Footer, Header } from '../Chrome';
import { BRAND, EXPERT_VOICES, GUARANTEES, NOTICES, QUOTE_NOTE, STATS } from '../content';

/**
 * 쓱싹 소개.
 *
 * 회사가 이미 쓰고 있는 카피를 그대로 옮겼다(`content.ts`). 여기서 하는 일은 **약속을
 * 먼저 보여 주는 것**이다: 처음 온 사람이 가장 먼저 묻는 것은 "얼마예요"가 아니라
 * "덤터기 안 씌워요?" 다.
 */
export default function About() {
  const nav = useNavigate();

  return (
    <div className="sg-site">
      <Header />

      <section className="sg-hero">
        <div className="sg-wrap sg-hero__inner">
          <div>
            <p className="sg-hero__eyebrow">{BRAND.tagline}</p>
            <h1 className="sg-hero__title">{BRAND.hero}</h1>
            <div className="sg-stats" style={{ marginTop: 28 }}>
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="sg-stats__v">{s.value}</div>
                  <div className="sg-stats__k">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <img className="sg-hero__art" src={BRAND.mascot} alt="" width={340} height={264} />
        </div>
      </section>

      <div className="sg-wrap">
        <section className="sg-section">
          <h2 className="sg-section__title">쓱싹만의 보장 서비스</h2>
          <p className="sg-section__lead">이 넷이 우리가 고객에게 하는 약속의 전부입니다.</p>
          <div className="sg-grid sg-grid--4">
            {GUARANTEES.map((g, i) => (
              <div className="sg-guard" key={g.title}>
                <div className="sg-guard__num">{i + 1}</div>
                <p className="sg-guard__title">{g.title}</p>
                <p className="sg-guard__body">{g.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="sg-section">
          <h2 className="sg-section__title">정직과 실력, 쓱싹 전문가들</h2>
          <p className="sg-section__lead">
            불신으로 가득했던 가전 시장에서, 이 사람들이 우리의 답입니다.
          </p>
          <div className="sg-grid sg-grid--3">
            {EXPERT_VOICES.map((e) => (
              <div className="sg-pro-card" key={e.name}>
                {e.photo ? (
                  <img
                    className="sg-pro-card__photo"
                    src={e.photo}
                    alt={`${e.name} 전문가`}
                    width={72}
                    height={72}
                  />
                ) : (
                  // 사진이 없다. **없는 사진을 남의 얼굴로 채우지 않는다.**
                  <div
                    className="sg-pro-card__photo"
                    aria-hidden="true"
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--color-contents-contents-sub)',
                      fontWeight: 800,
                    }}
                  >
                    {e.name[0]}
                  </div>
                )}
                <p className="sg-pro-card__quote">“{e.quote}”</p>
                <p className="sg-pro-card__body">{e.body}</p>
                <span className="sg-pro-card__name">{e.name} 전문가</span>
              </div>
            ))}
          </div>
        </section>

        <section className="sg-section">
          <h2 className="sg-section__title">견적 안내</h2>
          <Card>
            <div style={{ fontSize: 14, lineHeight: 1.7 }}>{QUOTE_NOTE}</div>
          </Card>
        </section>

        {/* 유의사항 — 주문 전에 읽혀야 하는 것. 장식이 아니다: '현장 추가비용'과
            '전화를 받아야 한다'는 우리 주문의 절반이 깨지는 지점이다. */}
        <section className="sg-section">
          <h2 className="sg-section__title">서비스 전체 유의사항</h2>
          <Card>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.9 }}>
              {NOTICES.map((n) => (
                <li key={n} style={{ color: 'var(--color-contents-contents-sub)' }}>
                  {n}
                </li>
              ))}
            </ul>
          </Card>

          <div style={{ marginTop: 24 }}>
            <Button variant="primary" onClick={() => nav('/')}>
              서비스 보러가기
            </Button>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
