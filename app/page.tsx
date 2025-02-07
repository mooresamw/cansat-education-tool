import Image from "next/image";

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
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Learn Anything,</span>
              <span className="block text-blue-600">Anytime, Anywhere</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Transform your learning experience with our interactive platform. 
              Join thousands of students worldwide in their journey to success.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <a href="#" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">
                  Start Learning
                </a>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <a href="#" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
                  View Courses
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Why Choose Us
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Everything you need to succeed in your learning journey
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="relative p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="text-center">
                <div className="h-12 w-12 text-blue-600 mx-auto mb-4">
                  {/* You can add an icon here */}
                  <div className="h-full w-full rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xl">📚</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Interactive Learning</h3>
                <p className="mt-4 text-gray-500">
                  Engage with interactive content and real-time feedback to enhance your learning experience.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="relative p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="text-center">
                <div className="h-12 w-12 text-blue-600 mx-auto mb-4">
                  <div className="h-full w-full rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xl">🎯</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Personalized Path</h3>
                <p className="mt-4 text-gray-500">
                  Learn at your own pace with customized learning paths tailored to your goals.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="relative p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="text-center">
                <div className="h-12 w-12 text-blue-600 mx-auto mb-4">
                  <div className="h-full w-full rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xl">🌟</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Expert Support</h3>
                <p className="mt-4 text-gray-500">
                  Get help from industry experts and join a community of learners.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to dive in?</span>
            <span className="block text-blue-200">Start your learning journey today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <a href="#" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50">
                Get started
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="mt-8 border-t border-gray-200 pt-8 md:flex md:items-center md:justify-between">
            <div className="flex space-x-6 md:order-2">
              <a href="#" className="text-gray-400 hover:text-gray-500">
                About
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                Contact
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                Privacy
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                Terms
              </a>
            </div>
            <p className="mt-8 text-base text-gray-400 md:mt-0 md:order-1">
              2025 EduPlatform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
