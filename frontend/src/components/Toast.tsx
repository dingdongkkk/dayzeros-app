'use client';

interface ToastProps {
  message: string | null;
  visible: boolean;
}

export function Toast({ message, visible }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed left-1/2 bottom-[118px] z-50 -translate-x-1/2 font-mono text-[12px] tracking-[1.4px] bg-[var(--ink)] text-[var(--cream)] px-5 py-[11px] rounded-full uppercase pointer-events-none transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0 shadow-lg' : 'opacity-0 translate-y-2'
      }`}
    >
      {message}
    </div>
  );
}
