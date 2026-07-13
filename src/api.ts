/**
 * 백엔드. 오리진이 같아서(vite proxy) 상대 경로면 된다.
 *
 * 서버의 목록은 전부 `{items, pagination}` 봉투다. 전문가앱에서 이걸 각 호출부가
 * 알아서 벗기게 뒀다가, 캐스팅 하나가 어긋나 TypeError 가 났고 화면은 그걸
 * "네트워크에 연결할 수 없어요" 로 뭉뚱그렸다. 여기서는 처음부터 한 군데서 벗긴다.
 */

const KEY = 'sgsg.shop.token';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let token: string | null = localStorage.getItem(KEY);

export const isLoggedIn = () => token != null;

export function setToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem(KEY, t);
  else localStorage.removeItem(KEY);
}

async function send(method: string, path: string, body?: unknown, idem?: string) {
  const res = await fetch(`/api/v1${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(idem ? { 'Idempotency-Key': idem } : {}),
    },
    body: body == null ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    // 401 은 세션이 죽은 것이다. 조용히 토큰을 버려야 다음 화면이 로그인으로 간다.
    if (res.status === 401) setToken(null);
    throw new ApiError(res.status, data?.error ?? '문제가 생겼어요. 잠시 후 다시 시도해 주세요.');
  }
  return data;
}

function items(d: unknown): unknown[] {
  if (Array.isArray(d)) return d;
  if (d && typeof d === 'object' && Array.isArray((d as any).items)) return (d as any).items;
  return [];
}

// --- 타입 ------------------------------------------------------------------

export type Item = {
  id: string;
  name: string;
  description?: string;
  'base-price': number;
  'category-id': string;
  'is-active': boolean;
};

export type Category = { id: string; name: string; slug?: string; items: Item[] };

export type Order = {
  id: string;
  status: string;
  'payment-status': string;
  'service-name'?: string;
  'order-number': { value: string };
  'expert-progress-status'?: string | null;
  'requested-date'?: string;
  cost: {
    'base-price': number;
    'total-amount': number;
    'deposit-amount': number;
    'paid-amount': number;
    'unpaid-amount': number;
  };
};

export type Review = { id: string; rating: number; content: string } | null;

// --- 스토어 (헤이홈 몰 = 위사 입점몰) -------------------------------------

export type StoreItem = {
  pno: number;
  name: string;
  price: number;
  'list-price'?: number;
  description?: string;
  image?: string | null;
  'buy-url': string;
};

export type Choice = { 'items-no': number; label: string; 'add-price': number };
export type Question = { opno: number; label: string; required: boolean; choices: Choice[] };

export type Quote = {
  pno: number;
  name: string;
  base: number;
  extra: number;
  total: number;
  options: Choice[];
};

export type Handoff = Quote & { selected: string[]; 'buy-url': string };

/** 현장 조건. 이걸 안 물으면 운영자가 다시 전화하고, 그 전화가 며칠을 잡아먹는다. */
export type Site = {
  'unit-type'?: string;
  'unit-count'?: number;
  floor?: number;
  elevator?: boolean;
  parking?: boolean;
  commercial?: boolean;
  ceiling?: string;
  'soil-level'?: string;
};

export type SiteQuote = {
  lines: { code: string; label: string; qty: number; amount: number }[];
  total: number;
};

// --- 호출 ------------------------------------------------------------------

export const api = {
  catalog: (): Promise<{ categories: Category[] }> => send('GET', '/shop/catalog'),

  // --- 스토어 ---
  // 확정가 상품은 헤이홈 몰에서 판다. 결제는 거기서 한다 — 돈은 한 군데서만 움직인다.
  store: (): Promise<{ enabled: boolean; items: StoreItem[] }> => send('GET', '/shop/store'),

  // 문진 = 상품의 옵션 세트. 문항을 우리가 따로 갖고 있지 않다.
  questions: (pno: number): Promise<{ pno: number; questions: Question[] }> =>
    send('GET', `/shop/store/${pno}/questions`),

  // 견적은 미리보기다. 진짜 금액은 몰이 계산한다.
  quote: (pno: number, choices: number[]): Promise<Quote> =>
    send('POST', `/shop/store/${pno}/quote`, { choices }),

  // 컨펌하면 몰의 상품 페이지로 넘어간다.
  confirm: (pno: number, choices: number[]): Promise<Handoff> =>
    send('POST', `/shop/store/${pno}/confirm`, { choices }),

  item: (id: string): Promise<Item> => send('GET', `/shop/catalog/items/${id}`),

  // 갈 수 있는 날. 회고: 접수→연락 5~7일의 상당 부분이 "언제 되는지 물어보는 왕복"이다.
  // **어느 전문가가 비어 있는지는 말하지 않는다** — 고객이 전문가를 고르는 구조가 아니다.
  availableDays: (unitType?: string): Promise<{
    reason?: string;
    days: { date: string; available: boolean }[];
  }> => send('GET', `/shop/available-days?days=14${unitType ? `&unitType=${unitType}` : ''}`),

  // 현장 조건 → 예상 추가금. **결제 전에 보여 준다.**
  // 추가비용을 숨기면 현장에서 싸운다 (운영 회고).
  siteQuote: (site: Site): Promise<SiteQuote> => send('POST', '/shop/site-quote', site),

  requestOtp: (phone: string) =>
    send('POST', '/shop/auth/request-otp', { phone }),

  verifyOtp: async (phone: string, code: string, name?: string) => {
    const d = await send('POST', '/shop/auth/verify-otp', { phone, code, name });
    setToken(d.token);
    return d;
  },

  logout: () => setToken(null),

  placeOrder: (body: unknown, idem: string): Promise<Order> =>
    send('POST', '/shop/my/orders', body, idem),

  myOrders: async (): Promise<Order[]> =>
    items(await send('GET', '/shop/my/orders')) as Order[],

  myOrder: (id: string): Promise<Order> => send('GET', `/shop/my/orders/${id}`),

  // 재시도가 두 번 청구되면 안 된다. 키는 주문에 묶는다 — 같은 주문의 계약금은
  // 몇 번을 눌러도 한 번이다.
  payDeposit: (id: string): Promise<unknown> =>
    send('POST', `/shop/my/orders/${id}/deposit`, undefined, `deposit:${id}`),

  conversationFor: async (orderId: string) => {
    const list = items(await send('GET', `/conversations?orderId=${orderId}`));
    return (list[0] as any) ?? null;
  },

  messages: (conversationId: string) =>
    send('GET', `/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: string, content: string) =>
    send('POST', `/conversations/${conversationId}/messages`, { content }),

  reviewOf: (orderId: string): Promise<Review> =>
    send('GET', `/my/orders/${orderId}/review`),

  writeReview: (orderId: string, rating: number, content: string) =>
    send('POST', `/my/orders/${orderId}/review`, { rating, content }),
};
