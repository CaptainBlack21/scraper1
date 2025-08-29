import React from "react";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const Button: React.FC<Props> = (props) => (
  <button {...props} style={{ padding: "5px 10px", cursor: "pointer", ...props.style }}>
    {props.children}
  </button>
);

export default Button;