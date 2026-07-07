import Navbar from "./components/Navbar/Navbar";
import Hero from "./components/Hero/Hero";
import Problem from "./components/Problem/Problem";
import Solution from "./components/Solution/Solution";
import Workflow from "./components/Workflow/Workflow";
import Bento from "./components/Bento/Bento";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Problem />
      <Solution />
      <Workflow />
      <Bento />
    </main>
  );
}
