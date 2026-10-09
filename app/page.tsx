import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Services from "@/components/Services";
import WhyUs from "@/components/WhyUs";
import EmergencyBar from "@/components/EmergencyBar";
import Reviews from "@/components/Reviews";
import About from "@/components/About";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <Services />
      <WhyUs />
      <EmergencyBar />
      <Reviews />
      <About />
      <Contact />
    </>
  );
}
