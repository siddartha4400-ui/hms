import React from 'react';

type InputIconProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
};

export default function InputBox({
  icon: Icon,
  className = '',
  ...props
}: InputIconProps) {
  const hasIcon = Boolean(Icon);

  return (
    <div className="relative h-12">
      {hasIcon && Icon && (
        <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none" style={{ color: 'var(--text-secondary)' }}>
          <Icon className="w-[18px] h-[18px]" />
        </div>
      )}
      <input
        className={`w-full h-12 leading-6 rounded-lg border text-base focus:outline-none disabled:opacity-50 md:text-sm ${className}`.trim()}
        style={{
          background: 'var(--bg-input)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
          paddingLeft: hasIcon ? '3.25rem' : '1rem',
          paddingRight: '1rem',
        }}
        {...props}
      />
    </div>
  );
}


