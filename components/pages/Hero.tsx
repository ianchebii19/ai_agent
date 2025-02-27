import Link from "next/link";
import { Button } from "../ui/button";

export default function Hero() {
    return (
      <div className="bg-blue-50 h-screen flex items-center justify-center">
        <div className="text-center">
          <div>
          <h1 className="text-4xl font-bold text-amber-600 mb-4">
           AI Assistant
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Meet your AI Chat Asistant that goes beyon chat coverstipn
          </p>
          <p className="text-xl text-gray-600 mb-8">
            Let yor task get done swifly 
          </p>
          </div>
         <div>
         <Link href="/dashboard">
            <Button className="bg-amber-700 text-white px-4 py-2 rounded-md hover:bg-amber-500 transition duration-300">
            Get Started
            </Button>
          </Link>
         </div>

        </div>
      </div>
    );
  }
