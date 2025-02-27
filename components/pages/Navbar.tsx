


  import Link from 'next/link';
import { Button } from '../ui/button';
//import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md fixed w-full z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
      {/*    <div className="flex-shrink-0">
            <Link href="/">
              <Image
                src="/conarc.png" alt="Logo" width={150} height={120}/>
            </Link>
            
          </div>

           Dashboard Button */}
           <div >
            <h1 className='text-amber-700 font-semibold text-xl'>
                Grek AI
            </h1>
           </div>
          <div>
            <Link href="/dashboard">
              <Button className="bg-amber-700 text-white px-4 py-2 rounded-md hover:bg-amber-500 transition duration-300">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}