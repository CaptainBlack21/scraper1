import React from "react";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input: React.FC<Props> = (props) => (
  <input {...props} style={{ padding: 5, ...props.style }} />
);

export default Input;