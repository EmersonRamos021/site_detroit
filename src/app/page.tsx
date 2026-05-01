import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/home/Hero";
import { StoreGrid } from "@/components/store/StoreGrid";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1 w-full flex flex-col">
        <Hero />
        <StoreGrid />
      </main>
      <Footer />
    </>
  );
}
