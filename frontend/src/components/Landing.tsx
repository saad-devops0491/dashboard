import React from 'react';
import { Link } from 'react-router-dom';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="w-full flex justify-between items-center">
        <div className="container md:mx-auto md:px-6">
          {/* Removed the navbar background / blur / border while keeping layout and spacing */}
          <div className="flex items-center justify-between h-20 mt-4 px-6">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <img
                src="https://res.cloudinary.com/drnak5yb2/image/upload/v1756278804/light_mode_logo_saher_btbdos.svg"
                alt="Saher Flow Solutions"
                className="h-10 w-auto"
              />
            </div>
            {/* Auth Buttons */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to="/login"
                className="text-white hover:text-yellow-400 transition-all duration-300 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 
               rounded-md hover:bg-white/10"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="bg-yellow-500/90 hover:bg-yellow-400 text-navy-900 px-6 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-300 border border-yellow-400/20 hover:shadow-lg hover:shadow-yellow-500/25"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 pt-10 pb-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-snug tracking-wider drop-shadow-lg">
            Saher Flow Solutions
            <span className="block text-yellow-400 md:mt-4 mt-2 drop-shadow-lg">
              Dashboard Portal
            </span>
          </h1>

          <p className="text-xl text-gray-200 mb-6 max-w-4xl mx-auto leading-relaxed drop-shadow-md">
            Advanced multiphase flow measurement and monitoring platform
          </p>

          <p className="text-lg text-gray-300 mb-12 mx-auto drop-shadow-md">
            Real-time data visualization • Remote monitoring • Comprehensive
            analytics
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-10 w-full">
            <Link
              to="/signup"
              className="w-full sm:w-auto text-center 
               bg-yellow-500/90 hover:bg-yellow-400 text-navy-900 
               px-6 py-3 rounded-lg text-base sm:text-lg font-medium 
               transition-all duration-300 shadow-xl 
               border border-yellow-400/20 
               hover:shadow-2xl hover:shadow-yellow-500/30 hover:scale-105"
            >
              Start Monitoring Your Assets
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto text-center 
               border-2 border-white/30 text-white 
               hover:bg-white/10 hover:border-white/50 
               px-6 py-3 rounded-lg text-base sm:text-lg font-medium 
               transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              Access Your Dashboard
            </Link>
          </div>

          {/* Key Features */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-16">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-white/10">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg
                  className="w-6 h-6 text-navy-900"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-white font-medium text-lg mb-3 drop-shadow-md">
                Real-time Monitoring
              </h3>
              <p className="text-gray-300 text-sm drop-shadow-sm">
                Monitor your multiphase flow meters and devices in real-time
                with instant alerts and notifications
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-white/10">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg
                  className="w-6 h-6 text-navy-900"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-white font-medium text-lg mb-3 drop-shadow-md">
                Data Analytics
              </h3>
              <p className="text-gray-300 text-sm drop-shadow-sm">
                Advanced analytics and reporting tools to optimize your
                production and operational efficiency
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-white/10">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg
                  className="w-6 h-6 text-navy-900"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-white font-medium text-lg mb-3 drop-shadow-md">
                Device Management
              </h3>
              <p className="text-gray-300 text-sm drop-shadow-sm">
                Centralized management of all your flow measurement devices with
                remote configuration capabilities
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
