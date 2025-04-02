"use client"
import Image from "next/image"
import Link from "next/link"

export default function Home() {
  const handleReload = () => {
    window.location.reload()
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="bg-black fixed w-full z-10 border-b border-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <Link href="/" passHref>
                <h1 className="text-xl font-medium text-white cursor-pointer" onClick={handleReload}>
                  CanSat
                </h1>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-8">
                <a href="#about" className="text-gray-400 hover:text-white transition-colors text-sm">
                  About
                </a>
                <a href="#program" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Program
                </a>
                <a href="#benefits" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Benefits
                </a>
                <a href="#contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Contact
                </a>

                <Link href="/login">
                  <button className="bg-white text-black px-4 py-2 rounded-sm hover:bg-gray-200 transition-colors text-sm">
                    Log In/Sign Up
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
            <span className="block">SPACE EDUCATION</span>
            <span className="block">ENRICHMENT PROGRAM</span>
          </h1>
          <h2 className="text-xl md:text-2xl font-medium mb-6 text-gray-300">CANSAT: HANDS-ON SATELLITE DESIGN</h2>
          <p className="text-gray-400 mb-10 max-w-2xl mx-auto">
            A comprehensive six-day summer training program that introduces space engineering education to middle and
            high school students through the exciting CanSat program.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="#program" className="px-8 py-3 bg-white text-black rounded-sm hover:bg-gray-200 transition-colors">
              Explore Program
            </a>
            <a
              href="#contact"
              className="px-8 py-3 border border-gray-700 text-gray-300 rounded-sm hover:border-white hover:text-white transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-12 border-t border-b border-gray-900">
        <div className="max-w-4xl mx-auto px-4">
          <blockquote className="text-center">
            <p className="text-xl md:text-2xl font-light italic text-gray-300">
              "Space is an inspirational concept that allows you to dream big"
            </p>
            <footer className="mt-4 text-gray-500">- Peter Diamandis</footer>
          </blockquote>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-12 text-center">ABOUT US</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <Image
                src="/images/satellite.png"
                alt="CanSat Program"
                width={800}
                height={600}
                className="w-full h-auto"
              />
            </div>
            <div>
              <p className="text-gray-400 mb-8">
                We are a Pennsylvania-based educational enterprise named Avakas, derived from the Khmer term for
                "space." Our primary objective is to deliver comprehensive training programs that offer insights into
                the realm of space and engineering.
              </p>
              <h3 className="text-xl font-medium mb-4 text-white">What is CanSat?</h3>
              <p className="text-gray-400">
                A CanSat is a simulation of a real satellite, integrated within the volume and shape of a soft drink
                can. CanSats offer a unique opportunity for students to have a first practical experience of a real
                space project.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Program Section */}
      <section id="program" className="py-20 bg-gray-950">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">LEARNING GOALS</h2>
          <p className="text-gray-400 mb-12 text-center max-w-2xl mx-auto">
            Our six-day program is designed to provide students with a comprehensive understanding of space engineering
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
            Partner with us to bring space education to your school and provide your students with unique opportunities
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
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Avakas Lab. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

