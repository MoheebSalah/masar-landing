import Loader from "./components/Loader/Loader";
import Navbar from "./components/Navbar/Navbar";
import Hero from "./components/Hero/Hero";
import Problem from "./components/Problem/Problem";
import Solution from "./components/Solution/Solution";
import Workflow from "./components/Workflow/Workflow";
import Bento from "./components/Bento/Bento";
import SeeInAction from "./components/SeeInAction/SeeInAction";
import CTA from "./components/CTA/CTA";
import CTARoad from "./components/CTARoad/CTARoad";
import CTACard from "./components/CTACard/CTACard";

export default function Home() {
  return (
    <main>
      <Loader />
      <Navbar />
      <Hero />
      <Problem />
      <Solution />
      <Workflow />
      <Bento />
      <SeeInAction />
      <CTA />
      <CTARoad />
      <CTACard />
    </main>
  );
}
