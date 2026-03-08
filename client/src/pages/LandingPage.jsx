import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPinIcon, 
  ClockIcon, 
  UserGroupIcon, 
  TruckIcon,
  AcademicCapIcon,
  CogIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { 
  MapPinIcon as MapPinSolid,
  ClockIcon as ClockSolid,
  UserGroupIcon as UserGroupSolid,
  TruckIcon as TruckSolid
} from '@heroicons/react/24/solid';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [driverPassword, setDriverPassword] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 5);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <MapPinSolid className="w-8 h-8 text-blue-600" />,
      title: "Live Bus Tracking",
      description: "Track buses in real-time with GPS technology and interactive maps",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <ClockSolid className="w-8 h-8 text-green-600" />,
      title: "ETA Prediction",
      description: "Get accurate arrival times with intelligent route analysis",
      color: "from-green-500 to-green-600"
    },
    {
      icon: <UserGroupSolid className="w-8 h-8 text-purple-600" />,
      title: "Student Dashboard",
      description: "Personalized dashboard for students to track their buses",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: <TruckSolid className="w-8 h-8 text-orange-600" />,
      title: "Driver Dashboard",
      description: "Comprehensive dashboard for drivers with route management",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: <CogIcon className="w-8 h-8 text-red-600" />,
      title: "Route Visualization",
      description: "Visualize bus routes with interactive maps and real-time updates",
      color: "from-red-500 to-red-600"
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Student Login",
      description: "Students login with their credentials to access their personalized dashboard",
      icon: <AcademicCapIcon className="w-8 h-8 text-blue-600" />
    },
    {
      number: "2",
      title: "Track Bus",
      description: "View real-time bus location, route information, and estimated arrival times",
      icon: <MapPinIcon className="w-8 h-8 text-green-600" />
    },
    {
      number: "3",
      title: "Get Notified",
      description: "Receive notifications about bus arrival, delays, and route changes",
      icon: <ClockIcon className="w-8 h-8 text-purple-600" />
    }
  ];

  const screenshots = [
    {
      title: "Student Dashboard",
      description: "Track your bus in real-time with interactive maps",
      image: "https://via.placeholder.com/400x250/1e40af/ffffff?text=Student+Dashboard"
    },
    {
      title: "Driver Dashboard",
      description: "Comprehensive route management for drivers",
      image: "https://via.placeholder.com/400x250/059669/ffffff?text=Driver+Dashboard"
    },
    {
      title: "Live Tracking",
      description: "Real-time bus tracking with GPS technology",
      image: "https://via.placeholder.com/400x250/dc2626/ffffff?text=Live+Tracking"
    }
  ];

  const handleStudentLogin = (e) => {
    e.preventDefault();
    // Handle student login logic
    console.log('Student login:', { email: studentEmail, password: studentPassword });
  };

  const handleDriverLogin = (e) => {
    e.preventDefault();
    // Handle driver login logic
    console.log('Driver login:', { email: driverEmail, password: driverPassword });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation Bar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <TruckIcon className="w-8 h-8 text-blue-600 mr-3" />
              <span className="text-xl font-bold text-gray-900">Smart Bus Tracking</span>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/student-login" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Student Login
              </Link>
              <Link to="/driver-login" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Driver Login
              </Link>
              <Link 
                to="/login" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                Login
              </Link>
            </div>
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="text-gray-700 hover:text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 hero-bg"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="hero-title text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
              <span className="text-gradient-blue">
                Smart Bus Tracking
              </span>
              <br />
              <span className="text-3xl sm:text-4xl lg:text-5xl text-gray-700">System</span>
            </h1>
            <p className="hero-subtitle text-xl sm:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Track buses in real-time, get accurate ETA predictions, and never miss your ride again
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/student-login" 
                className="btn-primary bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                Get Started
                <ArrowRightIcon className="inline-block w-5 h-5 ml-2" />
              </Link>
              <Link 
                to="/driver-login" 
                className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transform hover:scale-105 transition-all duration-200"
              >
                Driver Portal
              </Link>
            </div>
          </div>
        </div>

        {/* Bus Illustration */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-8 text-gray-600">
            <TruckIcon className="w-12 h-12 animate-bounce" />
            <div className="flex items-center space-x-2">
              <MapPinIcon className="w-6 h-6 text-red-500" />
              <div className="w-20 h-1 bg-gray-300"></div>
              <MapPinIcon className="w-6 h-6 text-green-500" />
            </div>
            <TruckIcon className="w-12 h-12 animate-bounce animation-delay-1000" />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">About the Project</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our Smart Bus Tracking System revolutionizes campus transportation by providing real-time 
              bus tracking, accurate ETA predictions, and seamless communication between students, drivers, and administrators.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <CheckCircleIcon className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Real-time Tracking</h3>
                  <p className="text-gray-600">Track buses live with GPS technology and interactive maps</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircleIcon className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Smart Notifications</h3>
                  <p className="text-gray-600">Get instant alerts about bus arrivals and delays</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircleIcon className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">User-friendly Interface</h3>
                  <p className="text-gray-600">Intuitive dashboards for students and drivers</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 text-center">
              <TruckIcon className="w-24 h-24 text-blue-600 mx-auto mb-4" />
              <p className="text-lg text-gray-700 font-medium">Making campus transportation smarter and more efficient</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Key Features</h2>
            <p className="text-xl text-gray-600">Everything you need for seamless bus tracking</p>
          </div>
          
          <div className="feature-grid grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`feature-card bg-white rounded-xl p-8 shadow-elevation-2 transform transition-all duration-300 hover:scale-105 hover:shadow-elevation-4 ${
                  activeFeature === index ? 'ring-2 ring-blue-500' : ''
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className={`w-16 h-16 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple three-step process to track your bus</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    {step.number}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Dashboard Preview</h2>
            <p className="text-xl text-gray-600">Take a look at our intuitive interfaces</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {screenshots.map((screenshot, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105">
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <img src={screenshot.image} alt={screenshot.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{screenshot.title}</h3>
                  <p className="text-gray-600">{screenshot.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Login Section */}
      <section className="py-20 bg-white bg-pattern-dots">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Login to Your Dashboard</h2>
            <p className="text-xl text-gray-600">Choose your role to get started</p>
          </div>
          
          <div className="login-grid grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Student Login Card */}
            <div className="login-card bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 shadow-elevation-3">
              <div className="text-center mb-6">
                <AcademicCapIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900">Student Login</h3>
                <p className="text-gray-600 mt-2">Access your personalized dashboard</p>
              </div>
              
              <form onSubmit={handleStudentLogin} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Student Email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="form-input w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    className="form-input w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Login as Student
                </button>
              </form>
              
              <div className="mt-6 text-center">
                <Link to="/student-login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Go to Student Portal →
                </Link>
              </div>
            </div>

            {/* Driver Login Card */}
            <div className="login-card bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 shadow-elevation-3">
              <div className="text-center mb-6">
                <TruckIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900">Driver Login</h3>
                <p className="text-gray-600 mt-2">Access your driver dashboard</p>
              </div>
              
              <form onSubmit={handleDriverLogin} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Driver Email"
                    value={driverEmail}
                    onChange={(e) => setDriverEmail(e.target.value)}
                    className="form-input w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={driverPassword}
                    onChange={(e) => setDriverPassword(e.target.value)}
                    className="form-input w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Login as Driver
                </button>
              </form>
              
              <div className="mt-6 text-center">
                <Link to="/driver-login" className="text-green-600 hover:text-green-700 font-medium">
                  Go to Driver Portal →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <TruckIcon className="w-8 h-8 text-blue-400 mr-3" />
                <span className="text-xl font-bold">Smart Bus Tracking</span>
              </div>
              <p className="text-gray-400">
                Revolutionizing campus transportation with real-time tracking and smart notifications.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/student-login" className="footer-link hover:text-white transition-colors">Student Login</Link></li>
                <li><Link to="/driver-login" className="footer-link hover:text-white transition-colors">Driver Login</Link></li>
                <li><Link to="/about" className="footer-link hover:text-white transition-colors">About</Link></li>
                <li><Link to="/contact" className="footer-link hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Connect</h4>
              <div className="flex space-x-4">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-icon text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Smart Bus Tracking System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
