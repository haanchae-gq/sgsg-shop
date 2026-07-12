import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Input } from '@sgsg/design/components';
import { api, ApiError } from '../api';

/**
 * 전화번호 + 인증번호. 비밀번호는 없다.
 *
 * 계정은 첫 로그인에 만들어진다 — '회원가입' 화면이 따로 없는 이유다. 서비스를
 * 받으러 온 사람에게 가입 절차를 하나 더 세우면 거기서 절반이 나간다.
 */
export default function Login() {
  const nav = useNavigate();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const digits = phone.replace(/\D/g, '');

  async function request() {
    if (digits.length < 10) {
      setError('휴대폰 번호를 확인해 주세요.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.requestOtp(digits);
      setSent(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '인증번호를 보내지 못했어요.');
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    setError(null);
    try {
      await api.verifyOtp(digits, code.trim(), name.trim() || undefined);
      const back = sessionStorage.getItem('sgsg.after-login');
      sessionStorage.removeItem('sgsg.after-login');
      nav(back ?? '/orders', { replace: true });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '인증에 실패했어요.');
      setBusy(false);
    }
  }

  return (
    <div className="sg-shell sg-pad">
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>휴대폰으로 시작하기</h1>
      <p className="sg-muted">주문 확인과 전문가와의 대화에 쓰여요.</p>

      <Card>
        <div className="sg-stack">
          <Input
            label="휴대폰 번호"
            inputMode="numeric"
            placeholder="01012345678"
            value={phone}
            disabled={sent}
            onChange={(e) => setPhone(e.target.value)}
          />

          {sent && (
            <>
              <Input
                label="인증번호"
                inputMode="numeric"
                placeholder="6자리"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Input
                label="이름 (선택)"
                placeholder="전문가가 부를 이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </>
          )}

          {error && <Alert type="danger" title={error} />}

          {!sent ? (
            <Button variant="primary" size="l" fullWidth loading={busy} onClick={request}>
              인증번호 받기
            </Button>
          ) : (
            <>
              <Button variant="primary" size="l" fullWidth loading={busy} onClick={verify}>
                확인
              </Button>
              <Button variant="ghost" size="s" fullWidth onClick={() => setSent(false)}>
                번호를 잘못 입력했어요
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
