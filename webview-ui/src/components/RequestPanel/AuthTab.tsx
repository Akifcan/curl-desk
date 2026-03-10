import { Request, AuthType } from '../../types';

interface AuthTabProps {
  auth: Request['auth'];
  onAuthChange: (auth: Request['auth']) => void;
}

export function AuthTab({ auth, onAuthChange }: AuthTabProps) {
  const update = (partial: Partial<Request['auth']>) =>
    onAuthChange({ ...auth, ...partial });

  return (
    <div className="auth-tab">
      <div className="auth-type-row">
        <label className="field-label">Auth Type</label>
        <select
          className="auth-select"
          value={auth.type}
          onChange={(e) => update({ type: e.target.value as AuthType })}
        >
          <option value="none">No Auth</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
        </select>
      </div>

      {auth.type === 'bearer' && (
        <div className="auth-field">
          <label className="field-label">Token</label>
          <input
            className="field-input"
            type="text"
            placeholder="your-token-here"
            value={auth.token}
            onChange={(e) => update({ token: e.target.value })}
          />
        </div>
      )}

      {auth.type === 'basic' && (
        <>
          <div className="auth-field">
            <label className="field-label">Username</label>
            <input
              className="field-input"
              type="text"
              placeholder="username"
              value={auth.username}
              onChange={(e) => update({ username: e.target.value })}
            />
          </div>
          <div className="auth-field">
            <label className="field-label">Password</label>
            <input
              className="field-input"
              type="password"
              placeholder="password"
              value={auth.password}
              onChange={(e) => update({ password: e.target.value })}
            />
          </div>
        </>
      )}

      {auth.type === 'none' && (
        <div className="auth-none-msg">No authentication for this request.</div>
      )}
    </div>
  );
}
