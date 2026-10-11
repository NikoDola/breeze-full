import HeroSection from "@/components/sections/home/HeroSection";
import SeasonsSection from "@/components/sections/home/SeasonsSection";
import ContactSection from "@/components/sections/home/ContactSection";
import AreaSection from "@/components/sections/home/AreaSection";
import ReviewsSection from "@/components/sections/home/ReviewsSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <SeasonsSection />
      <ContactSection />
      <ReviewsSection />
      <AreaSection />
    </>
  );
}
