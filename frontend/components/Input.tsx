import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export default function Input(props: Props) {
  const { className = "form-control h-11 text-base md:text-sm", ...rest } = props;
  return <input className={className} {...rest} />;
}
