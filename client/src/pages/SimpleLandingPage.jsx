import React, { useState, useEffect, useRef } from 'react';
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

const SimpleLandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const loginRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrollY(scrollPosition);
      setScrolled(scrollPosition > 50);
    };

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Calculate 3D transform values based on scroll and mouse position
  const calculateTransform = (element) => {
    const rect = element?.getBoundingClientRect();
    if (!rect) return { rotateX: 0, rotateY: 0, scale: 1 };
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rotateY = ((mousePosition.x - centerX) / window.innerWidth) * 10;
    const rotateX = ((mousePosition.y - centerY) / window.innerHeight) * -10;
    const scale = 1 + (scrollY * 0.0005);
    
    return { rotateX, rotateY, scale: Math.min(scale, 1.1) };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation Bar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <TruckIcon className="w-8 h-8 text-blue-600 mr-3" />
              <span className="text-xl font-bold text-gray-900">Smart Bus Tracking</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/student-login" className="text-gray-700 hover:text-blue-600 transition-colors">
                Student Login
              </Link>
              <Link to="/driver-login" className="text-gray-700 hover:text-blue-600 transition-colors">
                Driver Login
              </Link>
              <Link 
                to="/login" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          transform: `perspective(1000px) rotateX(${calculateTransform(heroRef.current).rotateX}deg) rotateY(${calculateTransform(heroRef.current).rotateY}deg) scale(${calculateTransform(heroRef.current).scale})`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>
        
        {/* Animated 3D Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"
            style={{
              transform: `translate3d(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px, 0) rotate(${scrollY * 0.1}deg)`,
              transition: 'transform 0.3s ease-out'
            }}
          ></div>
          <div 
            className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"
            style={{
              transform: `translate3d(${mousePosition.x * -0.02}px, ${mousePosition.y * -0.02}px, 0) rotate(${-scrollY * 0.1}deg)`,
              transition: 'transform 0.3s ease-out'
            }}
          ></div>
          <div 
            className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-4000"
            style={{
              transform: `translate3d(${Math.sin(scrollY * 0.01) * 20}px, ${Math.cos(scrollY * 0.01) * 20}px, 0) rotate(${scrollY * 0.2}deg)`,
              transition: 'transform 0.3s ease-out'
            }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div 
            className="max-w-4xl mx-auto"
            style={{
              transform: `translate3d(0, ${scrollY * -0.3}px, 0)`,
              opacity: Math.max(0.3, 1 - scrollY * 0.002),
              transition: 'all 0.3s ease-out'
            }}
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
              <span 
                className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                style={{
                  transform: `translate3d(${Math.sin(scrollY * 0.01) * 10}px, 0, 0)`,
                  transition: 'transform 0.3s ease-out'
                }}
              >
                Smart Bus Tracking
              </span>
              <br />
              <span 
                className="text-3xl sm:text-4xl lg:text-5xl text-gray-700"
                style={{
                  transform: `translate3d(${Math.cos(scrollY * 0.01) * 10}px, 0, 0)`,
                  transition: 'transform 0.3s ease-out'
                }}
              >
                System
              </span>
            </h1>
            <p 
              className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto"
              style={{
                transform: `translate3d(0, ${scrollY * -0.2}px, 0)`,
                opacity: Math.max(0.5, 1 - scrollY * 0.001),
                transition: 'all 0.3s ease-out'
              }}
            >
              Track buses in real-time, get accurate ETA predictions, and never miss your ride again
            </p>
            <div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              style={{
                transform: `translate3d(0, ${scrollY * -0.1}px, 0)`,
                transition: 'transform 0.3s ease-out'
              }}
            >
              <Link 
                to="/student-login" 
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-2xl"
                style={{
                  transform: `perspective(1000px) rotateX(${mousePosition.y * 0.01}deg) rotateY(${mousePosition.x * 0.01}deg)`,
                  transition: 'transform 0.1s ease-out'
                }}
              >
                Get Started
                <ArrowRightIcon className="inline-block w-5 h-5 ml-2" />
              </Link>
              <Link 
                to="/driver-login" 
                className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 hover:shadow-lg"
                style={{
                  transform: `perspective(1000px) rotateX(${mousePosition.y * 0.01}deg) rotateY(${mousePosition.x * 0.01}deg)`,
                  transition: 'transform 0.1s ease-out'
                }}
              >
                Driver Portal
              </Link>
            </div>
          </div>
        </div>

        {/* 3D Bus Illustration */}
        <div 
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          style={{
            transform: `translateX(-50%) translate3d(${Math.sin(scrollY * 0.02) * 30}px, ${scrollY * -0.5}px, ${Math.cos(scrollY * 0.01) * 50}px) rotateY(${scrollY * 0.5}deg)`,
            transition: 'transform 0.3s ease-out'
          }}
        >
          <div className="flex items-center space-x-8 text-gray-600">
            <TruckIcon 
              className="w-12 h-12 animate-bounce"
              style={{
                transform: `perspective(500px) rotateY(${mousePosition.x * 0.05}deg) rotateX(${-mousePosition.y * 0.05}deg)`,
                transition: 'transform 0.1s ease-out'
              }}
            />
            <div className="flex items-center space-x-2">
              <MapPinIcon className="w-6 h-6 text-red-500" />
              <div 
                className="w-20 h-1 bg-gray-300"
                style={{
                  transform: `scaleX(${1 + Math.sin(scrollY * 0.01) * 0.2})`,
                  transition: 'transform 0.3s ease-out'
                }}
              ></div>
              <MapPinIcon className="w-6 h-6 text-green-500" />
            </div>
            <TruckIcon 
              className="w-12 h-12 animate-bounce animation-delay-1000"
              style={{
                transform: `perspective(500px) rotateY(${mousePosition.x * 0.05}deg) rotateX(${-mousePosition.y * 0.05}deg)`,
                transition: 'transform 0.1s ease-out'
              }}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        ref={featuresRef}
        className="py-20 bg-gray-50"
        style={{
          transform: `perspective(1000px) rotateX(${calculateTransform(featuresRef.current).rotateX * 0.3}deg) rotateY(${calculateTransform(featuresRef.current).rotateY * 0.3}deg)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className="text-center mb-16"
            style={{
              transform: `translate3d(0, ${Math.max(0, (scrollY - 400) * -0.2)}px, 0)`,
              opacity: Math.min(1, Math.max(0.3, 1 - (Math.max(0, 400 - scrollY) * 0.002))),
              transition: 'all 0.3s ease-out'
            }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Key Features</h2>
            <p className="text-xl text-gray-600">Everything you need for seamless bus tracking</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div 
              className="bg-white rounded-xl p-8 shadow-lg transform transition-all duration-300 hover:scale-105"
              style={{
                transform: `perspective(1000px) rotateX(${calculateTransform(featuresRef.current).rotateX}deg) rotateY(${calculateTransform(featuresRef.current).rotateY}deg) translate3d(0, ${Math.max(0, (scrollY - 450) * -0.3)}px, 0)`,
                opacity: Math.min(1, Math.max(0.3, 1 - (Math.max(0, 450 - scrollY) * 0.002))),
                transition: 'all 0.3s ease-out'
              }}
            >
              <div 
                className="w-16 h-16 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mb-6"
                style={{
                  transform: `perspective(500px) rotateY(${mousePosition.x * 0.02}deg) rotateX(${-mousePosition.y * 0.02}deg) scale(${1 + Math.sin(Date.now() * 0.001) * 0.05})`,
                  transition: 'transform 0.1s ease-out'
                }}
              >
                <MapPinSolid className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Live Bus Tracking</h3>
              <p className="text-gray-600">Track buses in real-time with GPS technology and interactive maps</p>
            </div>
            
            <div 
              className="bg-white rounded-xl p-8 shadow-lg transform transition-all duration-300 hover:scale-105"
              style={{
                transform: `perspective(1000px) rotateX(${calculateTransform(featuresRef.current).rotateX}deg) rotateY(${calculateTransform(featuresRef.current).rotateY}deg) translate3d(0, ${Math.max(0, (scrollY - 450) * -0.3)}px, 0)`,
                opacity: Math.min(1, Math.max(0.3, 1 - (Math.max(0, 450 - scrollY) * 0.002))),
                transition: 'all 0.3s ease-out'
              }}
            >
              <div 
                className="w-16 h-16 rounded-lg bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center mb-6"
                style={{
                  transform: `perspective(500px) rotateY(${mousePosition.x * 0.02}deg) rotateX(${-mousePosition.y * 0.02}deg) scale(${1 + Math.sin(Date.now() * 0.001 + 1) * 0.05})`,
                  transition: 'transform 0.1s ease-out'
                }}
              >
                <ClockSolid className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">ETA Prediction</h3>
              <p className="text-gray-600">Get accurate arrival times with intelligent route analysis</p>
            </div>
            
            <div 
              className="bg-white rounded-xl p-8 shadow-lg transform transition-all duration-300 hover:scale-105"
              style={{
                transform: `perspective(1000px) rotateX(${calculateTransform(featuresRef.current).rotateX}deg) rotateY(${calculateTransform(featuresRef.current).rotateY}deg) translate3d(0, ${Math.max(0, (scrollY - 450) * -0.3)}px, 0)`,
                opacity: Math.min(1, Math.max(0.3, 1 - (Math.max(0, 450 - scrollY) * 0.002))),
                transition: 'all 0.3s ease-out'
              }}
            >
              <div 
                className="w-16 h-16 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center mb-6"
                style={{
                  transform: `perspective(500px) rotateY(${mousePosition.x * 0.02}deg) rotateX(${-mousePosition.y * 0.02}deg) scale(${1 + Math.sin(Date.now() * 0.001 + 2) * 0.05})`,
                  transition: 'transform 0.1s ease-out'
                }}
              >
                <UserGroupSolid className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Student Dashboard</h3>
              <p className="text-gray-600">Personalized dashboard for students to track their buses</p>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section 
        className="py-20 bg-gray-50"
        style={{
          transform: `perspective(1000px) rotateX(${calculateTransform(loginRef.current).rotateX * 0.1}deg) rotateY(${calculateTransform(loginRef.current).rotateY * 0.1}deg)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className="text-center mb-16"
            style={{
              transform: `translate3d(0, ${Math.max(0, (scrollY - 800) * -0.2)}px, 0)`,
              opacity: Math.min(1, Math.max(0.3, 1 - (Math.max(0, 800 - scrollY) * 0.002))),
              transition: 'all 0.3s ease-out'
            }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Dashboard Screenshots</h2>
            <p className="text-xl text-gray-600">See our powerful dashboards in action</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Student Dashboard */}
            <div 
              className="bg-white rounded-xl overflow-hidden shadow-lg transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
              style={{
                transform: `perspective(1000px) rotateX(${calculateTransform(loginRef.current).rotateX}deg) rotateY(${calculateTransform(loginRef.current).rotateY}deg) translate3d(${Math.sin(scrollY * 0.01) * 15}px, ${Math.max(0, (scrollY - 850) * -0.3)}px, 0)`,
                opacity: Math.min(1, Math.max(0.3, 1 - (Math.max(0, 850 - scrollY) * 0.002))),
                transition: 'all 0.3s ease-out'
              }}
            >
              <div className="relative group">
                <img 
                  src="/images/dashboards/student_dashboard.png" 
                  alt="Student Dashboard"
                  className="w-full h-48 object-cover"
                  style={{
                    transform: `perspective(500px) rotateY(${mousePosition.x * 0.02}deg) rotateX(${-mousePosition.y * 0.02}deg) scale(${1 + Math.sin(Date.now() * 0.001) * 0.03})`,
                    transition: 'transform 0.1s ease-out'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <PlayIcon className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center mb-3">
                  <div 
                    className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3"
                    style={{
                      transform: `perspective(300px) rotateY(${mousePosition.x * 0.03}deg) rotateX(${-mousePosition.y * 0.03}deg)`,
                      transition: 'transform 0.1s ease-out'
                    }}
                  >
                    <AcademicCapIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Student Dashboard</h3>
                </div>
                <p className="text-gray-600">Track your buses, view real-time locations, and get accurate ETAs for your daily commute.</p>
                <div className="mt-4 flex items-center text-blue-600 font-medium">
                  <span>Explore Features</span>
                  <ArrowRightIcon className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>

            {/* Driver Dashboard */}
            <div 
              className="bg-white rounded-xl overflow-hidden shadow-lg transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
              style={{
                transform: `perspective(1000px) rotateX(${calculateTransform(loginRef.current).rotateX}deg) rotateY(${calculateTransform(loginRef.current).rotateY}deg) translate3d(${Math.cos(scrollY * 0.01) * 15}px, ${Math.max(0, (scrollY - 850) * -0.3)}px, 0)`,
                opacity: Math.min(1, Math.max(0.3, 1 - (Math.max(0, 850 - scrollY) * 0.002))),
                transition: 'all 0.3s ease-out'
              }}
            >
              <div className="relative group">
                <img 
                  src="/images/dashboards/driver-dashboard.png" 
                  alt="Driver Dashboard"
                  className="w-full h-48 object-cover"
                  style={{
                    transform: `perspective(500px) rotateY(${mousePosition.x * 0.02}deg) rotateX(${-mousePosition.y * 0.02}deg) scale(${1 + Math.sin(Date.now() * 0.001 + 1) * 0.03})`,
                    transition: 'transform 0.1s ease-out'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <PlayIcon className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center mb-3">
                  <div 
                    className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3"
                    style={{
                      transform: `perspective(300px) rotateY(${mousePosition.x * 0.03}deg) rotateX(${-mousePosition.y * 0.03}deg)`,
                      transition: 'transform 0.1s ease-out'
                    }}
                  >
                    <TruckIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Driver Dashboard</h3>
                </div>
                <p className="text-gray-600">Manage routes, track passengers, and update your location in real-time for efficient service.</p>
                <div className="mt-4 flex items-center text-green-600 font-medium">
                  <span>Start Driving</span>
                  <ArrowRightIcon className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>

            {/* Admin Dashboard */}
            <div 
              className="bg-white rounded-xl overflow-hidden shadow-lg transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
              style={{
                transform: `perspective(1000px) rotateX(${calculateTransform(loginRef.current).rotateX}deg) rotateY(${calculateTransform(loginRef.current).rotateY}deg) translate3d(${Math.sin(scrollY * 0.01 + 2) * 15}px, ${Math.max(0, (scrollY - 850) * -0.3)}px, 0)`,
                opacity: Math.min(1, Math.max(0.3, 1 - (Math.max(0, 850 - scrollY) * 0.002))),
                transition: 'all 0.3s ease-out'
              }}
            >
              <div className="relative group">
                <img 
                  src="/images/dashboards/admin-dashboard.png" 
                  alt="Admin Dashboard"
                  className="w-full h-48 object-cover"
                  style={{
                    transform: `perspective(500px) rotateY(${mousePosition.x * 0.02}deg) rotateX(${-mousePosition.y * 0.02}deg) scale(${1 + Math.sin(Date.now() * 0.001 + 2) * 0.03})`,
                    transition: 'transform 0.1s ease-out'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <PlayIcon className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center mb-3">
                  <div 
                    className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-3"
                    style={{
                      transform: `perspective(300px) rotateY(${mousePosition.x * 0.03}deg) rotateX(${-mousePosition.y * 0.03}deg)`,
                      transition: 'transform 0.1s ease-out'
                    }}
                  >
                    <CogIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Admin Dashboard</h3>
                </div>
                <p className="text-gray-600">Monitor all buses, manage routes, analyze data, and oversee the entire transportation system.</p>
                <div className="mt-4 flex items-center text-purple-600 font-medium">
                  <span>Manage System</span>
                  <ArrowRightIcon className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Login Section */}
      <section 
        ref={loginRef}
        className="py-20 bg-white"
        style={{
          transform: `perspective(1000px) rotateX(${calculateTransform(loginRef.current).rotateX * 0.2}deg) rotateY(${calculateTransform(loginRef.current).rotateY * 0.2}deg)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className="text-center mb-16"
            style={{
              transform: `translate3d(0, ${Math.max(0, (scrollY - 1000) * -0.2)}px, 0)`,
              opacity: Math.min(1, Math.max(0.3, 1 - (Math.max(0, 1000 - scrollY) * 0.002))),
              transition: 'all 0.3s ease-out'
            }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Login to Your Dashboard</h2>
            <p className="text-xl text-gray-600">Choose your role to get started</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Student Login Card */}
            <div 
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              style={{
                transform: `perspective(1000px) rotateX(${calculateTransform(loginRef.current).rotateX}deg) rotateY(${calculateTransform(loginRef.current).rotateY}deg) translate3d(${Math.sin(scrollY * 0.01) * 10}px, ${Math.max(0, (scrollY - 1050) * -0.3)}px, 0)`,
                opacity: Math.min(1, Math.max(0.3, 1 - (Math.max(0, 1050 - scrollY) * 0.002))),
                transition: 'all 0.3s ease-out'
              }}
            >
              <div className="text-center mb-6">
                <AcademicCapIcon 
                  className="w-16 h-16 text-blue-600 mx-auto mb-4"
                  style={{
                    transform: `perspective(500px) rotateY(${mousePosition.x * 0.03}deg) rotateX(${-mousePosition.y * 0.03}deg) scale(${1 + Math.sin(Date.now() * 0.002) * 0.1})`,
                    transition: 'transform 0.1s ease-out'
                  }}
                />
                <h3 className="text-2xl font-bold text-gray-900">Student Login</h3>
                <p className="text-gray-600 mt-2">Access your personalized dashboard</p>
              </div>
              
              <div className="mt-6 text-center">
                <Link 
                  to="/student-login" 
                  className="text-blue-600 hover:text-blue-700 font-medium inline-block"
                  style={{
                    transform: `perspective(500px) rotateX(${mousePosition.y * 0.02}deg) rotateY(${mousePosition.x * 0.02}deg)`,
                    transition: 'transform 0.1s ease-out'
                  }}
                >
                  Go to Student Portal →
                </Link>
              </div>
            </div>

            {/* Driver Login Card */}
            <div 
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              style={{
                transform: `perspective(1000px) rotateX(${calculateTransform(loginRef.current).rotateX}deg) rotateY(${calculateTransform(loginRef.current).rotateY}deg) translate3d(${Math.cos(scrollY * 0.01) * 10}px, ${Math.max(0, (scrollY - 1050) * -0.3)}px, 0)`,
                opacity: Math.min(1, Math.max(0.3, 1 - (Math.max(0, 1050 - scrollY) * 0.002))),
                transition: 'all 0.3s ease-out'
              }}
            >
              <div className="text-center mb-6">
                <TruckIcon 
                  className="w-16 h-16 text-green-600 mx-auto mb-4"
                  style={{
                    transform: `perspective(500px) rotateY(${mousePosition.x * 0.03}deg) rotateX(${-mousePosition.y * 0.03}deg) scale(${1 + Math.sin(Date.now() * 0.002 + 1) * 0.1})`,
                    transition: 'transform 0.1s ease-out'
                  }}
                />
                <h3 className="text-2xl font-bold text-gray-900">Driver Login</h3>
                <p className="text-gray-600 mt-2">Access your driver dashboard</p>
              </div>
              
              <div className="mt-6 text-center">
                <Link 
                  to="/driver-login" 
                  className="text-green-600 hover:text-green-700 font-medium inline-block"
                  style={{
                    transform: `perspective(500px) rotateX(${mousePosition.y * 0.02}deg) rotateY(${mousePosition.x * 0.02}deg)`,
                    transition: 'transform 0.1s ease-out'
                  }}
                >
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
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <TruckIcon className="w-8 h-8 text-blue-400 mr-3" />
              <span className="text-xl font-bold">Smart Bus Tracking</span>
            </div>
            <p className="text-gray-400 mb-4">
              Revolutionizing campus transportation with real-time tracking and smart notifications.
            </p>
            <p className="text-gray-400">
              &copy; 2024 Smart Bus Tracking System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SimpleLandingPage;
