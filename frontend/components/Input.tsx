import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export default function Input(props: Props) {
  const { className = "form-control", ...rest } = props;
  return <input className={className} {...rest} />;
}
