
import PromoBanner from "@/components/PromoBanner";
import Navbar from "@/components/Navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PromoBanner />
      <Navbar />
      {children}
    </>
  );
}
