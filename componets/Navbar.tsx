
import { NAV_LINKS } from "@/constant";
import Image from "next/image";
import Link from "next/link";
import Button from "./Button";

const Navbar = () =>
    {
    return(
        <nav className="flex
         max-container padding-container justify-between
        relative z-30 py-5">
           
           <Link href="/" >
                <Image src="/logo.jpeg" alt="logo" 
                width={74} height={20} />
           </Link> 
            <h1 className="hidden lg:flex font-bold text-gray-500">Mzuni Application system</h1> 

           <ul className="hidden h-full gap-12 lg:flex   space-x-4 ">
                {NAV_LINKS.map((link)=>(
                    <Link href={link.href} key={link.key}
                    className="regular-16 pb-1.5 transition-all hover:font-bold text-gray-500  ">
                        {link.label}
                    
                    </Link>
                ))}
            </ul>

            <div className="hidden sm:block lg:flex-center  ">
                    <Button 
                    type={"button"} 
                    title={"Login"} 
                    icon="/user.svg"
                    variant={"bg-gray-800"} />
            </div>

            <Image 
                src="/menu.svg"
                alt="menu"
                width={32}
                height={32}
                className="inline-block cursor-pointer lg:hidden"
            />
        </nav>
    )
}

export default Navbar;