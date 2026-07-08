import Loader from "./components/Loader/Loader";
import Navbar from "./components/Navbar/Navbar";
import Hero from "./components/Hero/Hero";
import Problem from "./components/Problem/Problem";
import Solution from "./components/Solution/Solution";
import Workflow from "./components/Workflow/Workflow";
import Bento from "./components/Bento/Bento";
import SeeInAction from "./components/SeeInAction/SeeInAction";

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
    </main>
  );
}
