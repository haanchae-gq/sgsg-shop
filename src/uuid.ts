/**
 * 멱등키용 UUID.
 *
 * ★ `crypto.randomUUID()` 는 **보안 컨텍스트에서만 존재한다** — HTTPS 이거나
 * localhost 여야 한다. 우리 소비자웹은 지금 평문 HTTP(115.68.102.153:4000)로
 * 서빙되고, 거기서는 브라우저가 그 함수를 아예 주지 않는다.
 *
 * `TypeError: crypto.randomUUID is not a function` 하나로 신청 화면이 통째로 죽었다.
 * 개발은 localhost 라 보안 컨텍스트였고, **그래서 못 봤다.**
 *
 * 도메인이 붙고 HTTPS 가 되면 첫 번째 가지가 쓰인다. 그때까지는 두 번째가 돈다.
 * 멱등키는 추측 불가능할 필요가 없다 — 같은 요청을 두 번 청구하지 않기 위한 것이지
 * 비밀이 아니다. 그래도 crypto 가 있으면 그걸 쓴다.
 */
export function uuid(): string {
  const c = globalThis.crypto;

  if (c?.randomUUID) return c.randomUUID();

  if (c?.getRandomValues) {
    const b = c.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40; // version 4
    b[8] = (b[8] & 0x3f) | 0x80; // variant
    const hex = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
      16,
      20,
    )}-${hex.slice(20)}`;
  }

  // crypto 가 통째로 없는 환경. 화면이 죽는 것보다는 낫다.
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
}
