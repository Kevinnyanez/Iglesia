import { useState, type FormEvent } from 'react';

interface MessageInputProps {
  placeholder?: string;
  onSend: (content: string) => Promise<void> | void;
}

export function MessageInput({ placeholder = 'Escribe un mensaje', onSend }: MessageInputProps) {
  const [value, setValue] = useState('');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextValue = value.trim();
    if (!nextValue) return;
    await onSend(nextValue);
    setValue('');
  };

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-slate-200 p-3">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm"
      />
      <button type="submit" className="btn-primary rounded-full">
        Enviar
      </button>
    </form>
  );
}
