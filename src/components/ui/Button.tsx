import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading, 
  className, 
  disabled, 
  ...props 
}) => {
  const variants = {
    primary: 'bg-white/10 text-white hover:bg-white/20 border border-white/10 shadow-xl backdrop-blur-md',
    secondary: 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/5',
    danger: 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/20',
    ghost: 'bg-transparent hover:bg-white/5 text-white/50 hover:text-white'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs tracking-widest uppercase font-bold',
    md: 'px-5 py-2.5 text-sm font-bold',
    lg: 'px-8 py-4 text-lg font-bold'
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
};
