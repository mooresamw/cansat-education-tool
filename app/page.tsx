import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm fixed w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">EduPlatform</h1>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-4">
                <a href="#features" className="text-gray-700 hover:text-gray-900 px-3 py-2">Features</a>
                <a href="#courses" className="text-gray-700 hover:text-gray-900 px-3 py-2">Courses</a>
                <a href="#testimonials" className="text-gray-700 hover:text-gray-900 px-3 py-2">Testimonials</a>
                <Link
                  href="/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Login/Sign Up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Learn Anything,</span>
            <span className="block text-blue-600">Anytime, Anywhere</span>
          </h1>
          <p className="mt-3 max-w-3xl mx-auto text-gray-500 sm:text-lg md:text-xl">
            Transform your learning experience with our interactive platform. Join thousands of students worldwide.
          </p>
          <div className="mt-5 flex justify-center space-x-4">
            <Link href="#">
              <div className="px-8 py-3 text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                Start Learning
              </div>
            </Link>
            <Link href="#">
              <div className="px-8 py-3 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50">
                View Courses
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Why Choose Us</h2>
          <p className="mt-4 text-lg text-gray-500">Everything you need to succeed in your learning journey</p>
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Interactive Learning", icon: "📚", description: "Engage with interactive content and real-time feedback." },
              { title: "Personalized Path", icon: "🎯", description: "Learn at your own pace with customized learning paths." },
              { title: "Expert Support", icon: "🌟", description: "Get help from industry experts and join a community." }
            ].map((feature, index) => (
              <div key={index} className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow text-center">
                <div className="h-12 w-12 mx-auto mb-4 bg-blue-100 flex items-center justify-center rounded-full">
                  <span className="text-xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                <p className="mt-4 text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 flex flex-col lg:flex-row lg:items-center lg:justify-between text-white">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            <span className="block">Ready to dive in?</span>
            <span className="block text-blue-200">Start your learning journey today.</span>
          </h2>
          <div className="mt-8 lg:mt-0">
            <Link href="#">
              <div className="px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50">
                Get started
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto border-t border-gray-200 pt-8 flex flex-col md:flex-row md:justify-between">
          <div className="flex space-x-6">
            {['About', 'Contact', 'Privacy', 'Terms'].map((item) => (
              <Link key={item} href="#">
                <div className="text-gray-400 hover:text-gray-500">{item}</div>
              </Link>
            ))}
          </div>
          <p className="mt-8 md:mt-0 text-base text-gray-400">2025 EduPlatform. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
