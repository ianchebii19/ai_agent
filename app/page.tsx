import Hero from "@/components/pages/Hero";
import Navbar from "@/components/pages/Navbar";

export default function Home() {
  return (

    <div className="max-w-[1240px] mx-auto">
      <Navbar/>
      <Hero/>
    </div>

  );
}