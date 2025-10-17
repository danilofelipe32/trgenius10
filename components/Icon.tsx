import React from 'react';

interface IconProps {
  name: string;
  className?: string;
  onClick?: () => void;
  title?: string;
}

export const Icon: React.FC<IconProps> = ({ name, className = '', onClick, title }) => {
  return <i className={`fas fa-${name} ${className}`} onClick={onClick} title={title}></i>;
};
