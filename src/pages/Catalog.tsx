import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Empty, Skeleton } from '@sgsg/design/components';
import { api, type Category } from '../api';
import { Footer, Header } from '../Chrome';
import { BRAND, GUARANTEES, STEPS, serviceImage } from '../content';

/** 홈. 로그인 없이 본다 — 처음 온 사람이 가격조차 못 보면 아무도 주문하지 않는다. */
export default function Catalog() {
  const nav = useNavigate();
  const [cats, setCats] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .catalog()
      .then((d) => setCats(d.categories))
      .catch(() => setError('서비스를 불러오지 못했어요.'));
  }, []);

  const items = (cats ?? []).flatMap((c) => c.items.map((it) => ({ ...it, cat: c.name })));

  return (
    <div className="sg-site">
      <Header />

      {/* ── 히어로 ─────────────────────────────────────────────────────
          처음 온 사람이 먼저 묻는 것은 "얼마예요"가 아니라 "덤터기 안 씌워요?" 다.
          약속을 가격보다 먼저 보여 준다. */}
      <section className="sg-hero">
        <div className="sg-wrap sg-hero__inner">
          <div>
            <p className="sg-hero__eyebrow">{BRAND.tagline}</p>
            <h1 className="sg-hero__title">{BRAND.hero}</h1>
            <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
              {/* Button 의 기본 variant 는 secondary 다. 주 CTA 는 명시해야 한다 —
                  안 그러면 두 버튼이 똑같이 보이고 무엇이 주요 행동인지 사라진다. */}
              <Button variant="primary" onClick={() => nav('/store')}>
                바로 신청하기
              </Button>
              <Button variant="secondary" onClick={() => nav('/about')}>
                쓱싹이 어떤 회사인지 보기
              </Button>
            </div>
          </div>
          <img className="sg-hero__art" src={BRAND.mascot} alt="" width={340} height={264} />
        </div>
      </section>

      <div className="sg-wrap">
        {/* ── 보장 ──────────────────────────────────────────────────── */}
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

        {/* ── 서비스 ────────────────────────────────────────────────── */}
        <section className="sg-section">
          <h2 className="sg-section__title">서비스</h2>
          <p className="sg-section__lead">
            '~'가 붙은 금액은 기본가입니다. 현장 상황에 따라 추가비용이 발생할 수 있고, 추가비용은
            전문가가 현장에서 알려 드리고 동의를 받은 뒤에만 청구됩니다.
          </p>

          {error && <Empty title={error} description="잠시 후 다시 시도해 주세요." />}

          {!cats && !error && (
            <div className="sg-grid sg-grid--3">
              <Skeleton height="96px" />
              <Skeleton height="96px" />
              <Skeleton height="96px" />
            </div>
          )}

          {cats && items.length > 0 && (
            <div className="sg-grid sg-grid--3">
              {items.map((it) => {
                const img = serviceImage(it.name);
                return (
                  <button
                    key={it.id}
                    type="button"
                    className="sg-svc"
                    onClick={() => nav(`/service/${it.id}`)}
                  >
                    {img ? (
                      <img className="sg-svc__thumb" src={img} alt="" width={64} height={64} />
                    ) : (
                      // 사진이 없는 서비스도 카드가 무너지지 않는다. 자리를 비워 둘 뿐이다.
                      <div className="sg-svc__thumb" aria-hidden="true" />
                    )}
                    <div className="sg-svc__body">
                      <p className="sg-svc__name">{it.name}</p>
                      {it.description && <p className="sg-svc__desc">{it.description}</p>}
                      <p className="sg-svc__price">
                        {Math.round(it['base-price']).toLocaleString('ko-KR')}원 ~
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {cats && items.length === 0 && (
            <Empty title="아직 등록된 서비스가 없어요." description="곧 찾아뵐게요." />
          )}
        </section>

        {/* ── 이용 방법 ─────────────────────────────────────────────── */}
        <section className="sg-section">
          <h2 className="sg-section__title">이용 방법</h2>
          <div className="sg-grid sg-grid--4">
            {STEPS.map((s, i) => (
              <div className="sg-step" key={s.title}>
                <div className="sg-step__n">{i + 1}</div>
                <div>
                  <p className="sg-step__t">{s.title}</p>
                  <p className="sg-step__d">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
