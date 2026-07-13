import Loader from "./components/Loader/Loader";
import Navbar from "./components/Navbar/Navbar";
import Hero from "./components/Hero/Hero";
import Problem from "./components/Problem/Problem";
import Solution from "./components/Solution/Solution";
import Workflow from "./components/Workflow/Workflow";
// import Bento from "./componendts/Bento/Bento";
import SeeInAction from "./components/SeeInAction/SeeInAction";
import CTARoad from "./components/CTARoad/CTARoad";
import Footer from "./components/Footer/Footer";
import PhoneShowcase from "./components/PhoneShowcase/PhoneShowcase";
import Map from "./components/Map/Map";
import Impact from "./components/Impact/Impact";

export default function Home() {
  return (
    <main>
      <Loader />
      <Navbar />
      <Hero />
      <Problem />
      <Solution />
      <Workflow />
      {/* <Bento /> */}
      <SeeInAction />
      <PhoneShowcase />
      <Impact />
      <Map />
      <CTARoad />
      <Footer />
    </main>

  );
}
