import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await signUp({ name, email, password });
      navigate('/', { replace: true });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'No fue posible crear la cuenta';
      const normalizedMessage = message.toLowerCase().includes('unprocessable')
        ? 'Registro rechazado por configuración de Supabase (verifica Email/Password habilitado y reglas de Auth).'
        : message;
      setError(normalizedMessage);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--app-bg)] p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold text-slate-900 sm:text-2xl">Crear cuenta</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre"
          className="w-full rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Correo electrónico"
          className="w-full rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contraseña"
          className="w-full rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          required
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" className="btn-primary w-full rounded-full py-2.5">
          Registrar
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-slate-900 underline">
          Inicia sesión
        </Link>
      </p>
      </div>
    </div>
  );
}
