import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { Hero } from '@/components/sections/hero';
import { About } from '@/components/sections/about';
import { Experience } from '@/components/sections/experience';
import { Achievements } from '@/components/sections/achievements';
import { RequestJourney } from '@/components/sections/request-journey';
import { Projects } from '@/components/sections/projects';
import { Decisions } from '@/components/sections/decisions';
import { Skills } from '@/components/sections/skills';
import { Principles } from '@/components/sections/principles';
import { Contact } from '@/components/sections/contact';

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <About />
        <Experience />
        <Achievements />
        <RequestJourney />
        <Projects />
        <Decisions />
        <Skills />
        <Principles />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
