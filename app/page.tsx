"use client"
import Image from "next/image"
import Link from "next/link"
import {ChevronDown} from "lucide-react";

export default function Home() {
  const handleReload = () => {
    window.location.reload()
  }

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }


  return (
      <main className="min-h-screen bg-white text-black">
        {/* Navigation */}
        <nav className="fixed w-full z-50 bg-white backdrop-blur-md border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between h-16 items-center">
              <Link href="/" className="text-xl font-medium">
                CanSat
              </Link>
              <div className="hidden md:flex items-center space-x-8">
                <button
                    onClick={() => scrollToSection("about")}
                    className="text-gray-600 hover:text-black transition-colors"
                >
                  About
                </button>
                <button
                    onClick={() => scrollToSection("program")}
                    className="text-gray-600 hover:text-black transition-colors"
                >
                  Program
                </button>
                <button
                    onClick={() => scrollToSection("contact")}
                    className="text-gray-600 hover:text-black transition-colors"
                >
                  Contact
                </button>
                <Link href="/login" className="">
                  <button className="bg-black text-white px-6 py-2 hover:bg-gray-800 transition-colors">
                    Login
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section
            className="h-screen flex flex-col justify-center items-center relative bg-gradient-to-b from-gray-50 to-white">
          <div className="text-center max-w-4xl mx-auto px-6">
            <h1 className="mb-8 text-3xl">Space Education</h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 font-light">
              Hands-on satellite design for the next generation
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                  onClick={() => scrollToSection("program")}
                  className="px-8 py-3 bg-black text-white hover:bg-gray-800 transition-all duration-300"
              >
                Explore Program
              </button>
              <button
                  onClick={() => scrollToSection("contact")}
                  className="px-8 py-3 border border-gray-300 text-gray-700 hover:border-black hover:text-black transition-all duration-300"
              >
                Get Started
              </button>
            </div>
          </div>
          <button onClick={() => scrollToSection("about")} className="absolute bottom-8 animate-bounce">
            <ChevronDown className="w-6 h-6 text-gray-400"/>
          </button>
        </section>

        {/* About Section */}
      <section id="about" className="py-32">
        <div className="mx-auto px-28">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="px-10 md:text-left text-center">
              <h2 className="text-4xl md:text-5xl font-light mb-8">What is CanSat?</h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                A simulation of a real satellite, integrated within the volume and shape of a soft drink can.
              </p>
              <p className="text-gray-500 leading-relaxed">
                CanSats offer students their first practical experience of a real space project, combining engineering
                principles with hands-on learning.
              </p>
            </div>
            <div className="relative flex justify-center">
              <Image
                src="/images/3d-model.png"
                alt="CanSat Satellite Design"
                width={600}
                height={500}
                className="w-full max-w-md h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <blockquote className="text-3xl md:text-4xl font-light text-gray-800 mb-8">
            "Space is an inspirational concept that allows you to dream big"
          </blockquote>
          <cite className="text-gray-500">— Peter Diamandis</cite>
        </div>
      </section>


{/* Program Section */}
      <section id="program" className="py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-light mb-6">Five-Day Journey</h2>
            <p className="text-xl text-gray-600 max-w-2xl mb-8 mx-auto">
              From space fundamentals to launching your own satellite
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-16 max-w-7xl mx-auto">
            {[
              {
                day: "01",
                title: "Space & Satellite Foundations",
                desc: "Understanding space environment and satellite basics",
                image: "/images/kid-coding-1.jpeg",
              },
              {
                day: "02",
                title: "Engineering & Micro-controllers",
                desc: "Arduino programming and engineering principles",
                image: "/images/playing-with-light.jpeg",
              },
              {
                day: "03",
                title: "Sensors, Data & Parachute Design",
                desc: "Sensor integration and recovery system design",
                image: "/images/balloon-and-cup.jpeg",
              },
              {
                day: "04",
                title: "Mission Planning & Assembly",
                desc: "Define objectives and build your CanSat",
                image: "/images/assembling.jpeg",
              },
              {
                day: "05",
                title: "Launch & Presentation",
                desc: "Present your mission and launch day",
                image: "/images/balloon-launch.jpeg",
              },
            ].map((item, index) => (
              <div key={index} className="group text-center">
                <div className="relative mb-2 overflow-hidden rounded-lg aspect-square mx-auto p-4" style={{ width: "250px", height: "250px" }}>
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.title}
                    width={200}
                    height={200}
                    className="w-full object-bottom object-cover hover:scale-105 translate-y-10 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-1 rounded text-sm font-medium">
                    Day {item.day}
                  </div>
                </div>
                <h3 className="text-lg font-medium mb-0.5">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Mission Section */}
      <section className="py-32 bg-black text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="text-center md:text-left">
              <h2 className="text-4xl md:text-5xl font-light mb-8">Our Mission</h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Introducing space engineering education to middle and high school students fascinated by space
                exploration.
              </p>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold mb-2">Objective</h3>
                  <p className="text-gray-400">Conceptual and practical skills in space engineering</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Instructors</h3>
                  <p className="text-gray-400">Trained facilitators and technology practitioners</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Method</h3>
                  <p className="text-gray-400">Experimental and project-based learning</p>
                </div>
              </div>
            </div>
            <div className="relative flex justify-center">
              <Image
                src="/images/cansat-parts.jpeg"
                alt="Space Education Mission"
                width={600}
                height={500}
                className="w-full max-w-md h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Visual Gallery Section */}
      {/*<section className="py-32 bg-gray-50">*/}
      {/*  <div className="max-w-6xl mx-auto px-6">*/}
      {/*    <div className="text-center mb-16">*/}
      {/*      <h2 className="text-4xl md:text-5xl font-light mb-6">Experience Space Engineering</h2>*/}
      {/*      <p className="text-xl text-gray-600 max-w-2xl mx-auto">See what students create in our hands-on program</p>*/}
      {/*    </div>*/}

      {/*    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">*/}
      {/*      <div className="text-center">*/}
      {/*        <Image*/}
      {/*          src="/placeholder.svg?height=400&width=500&text=Student+Building+CanSat"*/}
      {/*          alt="Students building CanSat"*/}
      {/*          width={500}*/}
      {/*          height={400}*/}
      {/*          className="w-full h-64 object-cover rounded-lg mb-4"*/}
      {/*        />*/}
      {/*        <h3 className="text-lg font-medium mb-2">Hands-On Building</h3>*/}
      {/*        <p className="text-gray-600">Students assembling their CanSat satellites</p>*/}
      {/*      </div>*/}
      {/*      <div className="text-center">*/}
      {/*        <Image*/}
      {/*          src="/placeholder.svg?height=400&width=500&text=Rocket+Launch+Preparation"*/}
      {/*          alt="Launch preparation"*/}
      {/*          width={500}*/}
      {/*          height={400}*/}
      {/*          className="w-full h-64 object-cover rounded-lg mb-4"*/}
      {/*        />*/}
      {/*        <h3 className="text-lg font-medium mb-2">Launch Preparation</h3>*/}
      {/*        <p className="text-gray-600">Getting ready for the big launch day</p>*/}
      {/*      </div>*/}
      {/*      <div className="text-center">*/}
      {/*        <Image*/}
      {/*          src="/placeholder.svg?height=400&width=500&text=Data+Analysis+Results"*/}
      {/*          alt="Data analysis"*/}
      {/*          width={500}*/}
      {/*          height={400}*/}
      {/*          className="w-full h-64 object-cover rounded-lg mb-4"*/}
      {/*        />*/}
      {/*        <h3 className="text-lg font-medium mb-2">Data Analysis</h3>*/}
      {/*        <p className="text-gray-600">Analyzing mission data and results</p>*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*  </div>*/}
      {/*</section>*/}

      {/* Benefits Section */}
      <section className="py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-light mb-6">Partnership Benefits</h2>
            <p className="text-xl text-gray-600 max-w-2xl mb-8 mx-auto">Enhance your school's STEM education program</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {[
              { title: "Space Education", desc: "Integrate space curriculum into your school" },
              { title: "STEM Enhancement", desc: "Enrich Science, Engineering & Technology subjects" },
              { title: "Space Club", desc: "Initialize ongoing space programs with students" },
              { title: "Future Competitions", desc: "Prepare students for space competitions" },
            ].map((item, index) => (
              <div key={index} className="group text-center">
                <h3 className="text-2xl font-light mb-4 group-hover:text-gray-600 transition-colors">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-light mb-8">Ready to Launch?</h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Contact us to bring space education to your school
          </p>
          <div className="mb-8">
            <a href="mailto:avakaslab@gmail.com" className="text-2xl font-light hover:text-gray-600 transition-colors">
              avakaslab@gmail.com
            </a>
          </div>
          <a
            href="mailto:avakaslab@gmail.com"
            className="inline-block px-4 py-4 bg-black text-white hover:bg-gray-800 transition-all duration-300 text-lg"
          >
            Get in Touch
          </a>
        </div>
      </section>


        {/* Footer */}
        <footer className="py-12 border-t border-gray-200">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex space-x-8 mb-4 md:mb-0">
                <button
                  onClick={() => scrollToSection("about")}
                  className="text-gray-500 hover:text-black transition-colors"
                >
                  About
                </button>
                <button
                  onClick={() => scrollToSection("contact")}
                  className="text-gray-500 hover:text-black transition-colors"
                >
                  Contact
                </button>
                <a href="#" className="text-gray-500 hover:text-black transition-colors">
                  Privacy
                </a>
              </div>
              <p className="text-gray-500">© {new Date().getFullYear()} Avakas Lab. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
  )
}

