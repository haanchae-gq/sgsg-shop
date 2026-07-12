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

// --- 호출 ------------------------------------------------------------------

export const api = {
  catalog: (): Promise<{ categories: Category[] }> => send('GET', '/shop/catalog'),

  item: (id: string): Promise<Item> => send('GET', `/shop/catalog/items/${id}`),

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
