import Link from "next/link";
import Image from "next/image";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { ModeToggle } from "./ModeToggle";
import DashboardButton from "./DashboardButton";

const Navbar = () => {
  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font_semibold text-2xl mr-6 font-mono hover:opacity-90 transition-opacity"
        >
          <Image src="/student.png" width={30} height={30} alt="Logo" />
          <span className="bg-gradient-to-r from-blue-600 to-violet-500 bg-clip-text text-transparent">Stuline</span>
        </Link>

        {/* Actions */}
        <SignedIn>
          <div className="flex items-center space-x-4 ml-auto">
            <DashboardButton />
            <ModeToggle />
            <UserButton />
          </div>
        </SignedIn>
      </div>
    </nav>
  );
};

export default Navbar;
