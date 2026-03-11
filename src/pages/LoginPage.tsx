import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await signIn({ email, password });
      const redirectPath = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';
      navigate(redirectPath, { replace: true });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'No fue posible iniciar sesión';
      const normalizedMessage = message.toLowerCase().includes('invalid login credentials')
        ? 'Credenciales inválidas. Verifica correo y contraseña.'
        : message;
      setError(normalizedMessage);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">Iniciar sesión</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Correo electrónico"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contraseña"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          required
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" className="btn-primary w-full">
          Entrar
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="text-slate-900 underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
