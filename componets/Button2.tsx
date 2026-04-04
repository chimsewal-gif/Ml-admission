import React from 'react';

interface Button2Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

const Button2: React.FC<Button2Props> = ({ label = 'Submit', ...props }) => {
  return (
    <button
      {...props}
      className={`w-full bg-gray-400 text-white py-2 px-4 rounded hover:bg-green-700 font-semibold ${props.className || ''}`}
    >
      {label}
    </button>
  );
};

export default Button2;
