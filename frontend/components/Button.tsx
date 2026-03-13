import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: string; // maps to Bootstrap variant class
  className?: string;
};

export default function Button({ variant = "primary", className = "", ...rest }: Props) {
  const cls = `btn btn-${variant} ${className}`.trim();
  return <button className={cls} {...rest} />;
}
