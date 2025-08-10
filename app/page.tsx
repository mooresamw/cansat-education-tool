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
                <Link href="/login">
                  <button className="bg-black text-white px-6 py-2 rounded-sm hover:bg-gray-800 transition-colors">
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

        {/* About Section */}
        {/*<section id="about" className="py-20">*/}
        {/*  <div className="max-w-4xl mx-auto px-4">*/}
        {/*    <h2 className="text-2xl md:text-3xl font-bold mb-12 text-center">ABOUT US</h2>*/}

        {/*    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">*/}
        {/*      <div>*/}
        {/*        <Image*/}
        {/*            src="/images/satellite.png"*/}
        {/*            alt="CanSat Program"*/}
        {/*            width={800}*/}
        {/*            height={600}*/}
        {/*            className="w-full h-auto"*/}
        {/*        />*/}
        {/*      </div>*/}
        {/*      <div>*/}
        {/*        <p className="text-gray-400 mb-8">*/}
        {/*          We are a Pennsylvania-based educational enterprise named Avakas, derived from the Khmer term for*/}
        {/*          "space." Our primary objective is to deliver comprehensive training programs that offer insights into*/}
        {/*          the realm of space and engineering.*/}
        {/*        </p>*/}
        {/*        <h3 className="text-xl font-medium mb-4 text-white">What is CanSat?</h3>*/}
        {/*        <p className="text-gray-400">*/}
        {/*          A CanSat is a simulation of a real satellite, integrated within the volume and shape of a soft drink*/}
        {/*          can. CanSats offer a unique opportunity for students to have a first practical experience of a real*/}
        {/*          space project.*/}
        {/*        </p>*/}
        {/*      </div>*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*</section>*/}

        {/* Program Section */}
        <section id="program" className="py-20 bg-gray-950">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">LEARNING GOALS</h2>
            <p className="text-gray-400 mb-12 text-center max-w-2xl mx-auto">
              Our six-day program is designed to provide students with a comprehensive understanding of space
              engineering
              and hands-on experience with satellite design.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  day: "Day 1",
                  title: "Space Environment",
                  description:
                      "Participants will be able to elaborate on and present information about the space environment.",
                },
                {
                  day: "Day 2",
                  title: "Satellite Research",
                  description: "Research about famous satellites and its application.",
                },
                {
                  day: "Day 3",
                  title: "Mission Objectives",
                  description: "Define their own mission objectives.",
                },
                {
                  day: "Day 4",
                  title: "Micro-controllers & Sensors",
                  description:
                      "Demonstrate understanding in micro-controller (Arduino) & applications of each sensor on CanSat.",
                },
                {
                  day: "Day 5",
                  title: "Programming & Assembly",
                  description: "Programming Arduino to work with sensors and assembling their own CanSat.",
                },
                {
                  day: "Day 6",
                  title: "Presentation & Launch",
                  description: "Presenting ideas as a group effectively and preparing for the CanSat launch.",
                },
              ].map((item, index) => (
                  <div key={index} className="border border-gray-800 p-6">
                    <div className="text-gray-500 font-medium mb-2">{item.day}</div>
                    <h3 className="text-lg font-medium mb-2">{item.title}</h3>
                    <p className="text-gray-400 text-sm">{item.description}</p>
                  </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-12 text-center">MISSION AND VISION</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-gray-400 mb-8">
                  Our mission is to introduce space engineering education to middle and high school students who are
                  fascinated by space and interested in pursuing careers in space or engineering as a whole. We aim to
                  provide them with a solid foundation through our CanSat program.
                </p>
                <h3 className="text-xl font-medium mb-4 text-white">Our Proposed Program</h3>
                <ul className="space-y-4 text-gray-400">
                  <li>
                    <span className="text-white">Objective:</span> Offers conceptual and practical skills in space
                    engineering, problem-solving through coding, and hands-on CanSat assembling.
                  </li>
                  <li>
                    <span className="text-white">Who will teach:</span> Students will be taught and mentored by trained
                    facilitators who are technology practitioners and academics.
                  </li>
                  <li>
                    <span className="text-white">What we teach:</span> Exploring elementary concepts and the process of
                    constructing a can-sized satellite through experimental and project-based learning.
                  </li>
                </ul>
              </div>
              <div>
                <Image
                    src="/images/satellite2.png"
                    alt="Space Education"
                    width={600}
                    height={400}
                    className="object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-20 bg-gray-950">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">PARTNERSHIP BENEFITS</h2>
            <p className="text-gray-400 mb-12 text-center max-w-2xl mx-auto">
              Partner with us to bring space education to your school and provide your students with unique
              opportunities
              in STEAM education.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "Space Education",
                  description: "Introducing space education in the school curriculum.",
                },
                {
                  title: "STEAM Enrichment",
                  description:
                      "Enrich STEAM education program in school particularly on Science, Engineering and Technology subjects.",
                },
                {
                  title: "Space Club",
                  description: "Initialize the space club at the school with students who have joined the program.",
                },
                {
                  title: "School Reputation",
                  description:
                      "Enhance the school reputation by letting the students join space competition in the future.",
                },
              ].map((item, index) => (
                  <div key={index} className="border border-gray-800 p-6">
                    <h3 className="text-lg font-medium mb-2">{item.title}</h3>
                    <p className="text-gray-400 text-sm">{item.description}</p>
                  </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contact" className="py-20 border-t border-gray-900">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">READY TO LAUNCH YOUR STUDENTS' FUTURE?</h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Contact us today to bring the Space Education Enrichment Program to your school.
            </p>
            <div className="mb-8">
              <a href="mailto:avakaslab@gmail.com" className="text-white hover:text-gray-300">
                avakaslab@gmail.com
              </a>
            </div>
            <a
                href="mailto:avakaslab@gmail.com"
                className="inline-block px-8 py-3 bg-white text-black rounded-sm hover:bg-gray-200 transition-colors"
            >
              Get in Touch
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-gray-900">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex space-x-6 mb-4 md:mb-0">
                <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
                  About
                </a>
                <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
                  Contact
                </a>
                <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
                  Privacy
                </a>
                <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
                  Terms
                </a>
              </div>
              <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Avakas Lab. All rights
                reserved.</p>
            </div>
          </div>
        </footer>
      </main>
  )
}

