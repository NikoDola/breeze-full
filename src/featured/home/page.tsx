import HeroSection from "@/components/sections/home/HeroSection";
import SeasonsSection from "@/components/sections/home/SeasonsSection";
import ContactSection from "@/components/sections/home/ContactSection";
import SmileSection from "@/components/sections/home/SmileSection";
import ServicesSection from "@/components/sections/home/ServicesSection";
import BestSection from "@/components/sections/home/BestSection";
import StorySection from "@/components/sections/home/StorySection";
import AreaSection from "@/components/sections/home/AreaSection";
import ReviewsSection from "@/components/sections/home/ReviewsSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <SeasonsSection />
      <ContactSection />
      <SmileSection />
      <ServicesSection />
      <BestSection />
      <StorySection />
      <AreaSection />
      <ReviewsSection />
    </>
  );
}
