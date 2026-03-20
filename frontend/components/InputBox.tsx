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
  return (
    <div className="relative">
      <input
        className={`w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-green-500 focus:outline-none disabled:opacity-50 ${Icon ? 'pl-10' : 'pl-4'} ${className}`.trim()}
        {...props}
      />
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <Icon className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}


