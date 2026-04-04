'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";


type ButtonProps = {
  type: 'button' | 'submit';
  title: string;
  icon?: string;
  variant: string;
  href?: string;
  
}

const Button = ({ type, title, icon, variant, href}: ButtonProps) => {

  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    }
  };

  
  return (
    
    <button
    onClick={handleClick}
    className={`flex items-center justfiy-center gap-2 pr-2 text-white
      font-bold rounded-full border ${variant}  'w-full'}`}

      type={type}
    >
      {icon && <Image src={icon} alt={title} width={24} height={24} />}
      <label className="bold-16 whitespace-nowrap  cursor-pointer">{title}</label>
    </button>
  )
}

export default Button