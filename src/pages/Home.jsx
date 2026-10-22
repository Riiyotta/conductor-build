import Header from '../components/Header.jsx'
import Hero from '../components/Hero.jsx'
import Logos from '../components/Logos.jsx'
import Multiplayer from '../components/Multiplayer.jsx'
import Sandbox from '../components/Sandbox.jsx'
import Orchestration from '../components/Orchestration.jsx'
import Anywhere from '../components/Anywhere.jsx'
import Testimonials from '../components/Testimonials.jsx'
import Changelog from '../components/Changelog.jsx'
import CTA from '../components/CTA.jsx'
import Footer from '../components/Footer.jsx'

// Homepage composition (route "/"), moved unchanged from App.jsx.
export default function Home() {
  return (
    <div className="bg-background font-sans">
      <Header />
      <Hero />
      <Logos />
      <div>
        <Multiplayer />
        <Sandbox />
        <Orchestration />
        <Anywhere />
      </div>
      <Testimonials />
      <Changelog />
      <CTA />
      <Footer />
    </div>
  )
}
