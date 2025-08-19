import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FaMoon, FaSun, FaBell, FaUser } from 'react-icons/fa';

const Header = ({ title = "MiniProject Manager" }) => {
    const { currentUser } = useAuth();
    const { darkMode, toggleDarkMode } = useTheme();

    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm py-3 px-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h1>
            
            <div className="flex items-center space-x-4">
                {/* Dark Mode Toggle */}
                <button 
                    onClick={toggleDarkMode}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                    {darkMode ? (
                        <FaSun className="text-yellow-400" />
                    ) : (
                        <FaMoon className="text-gray-600" />
                    )}
                </button>
                
                {/* Notifications */}
                <div className="relative">
                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <FaBell className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        3
                    </span>
                </div>
                
                {/* User Profile */}
                <button className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors">
                    {currentUser?.photoURL ? (
                        <img 
                            src={currentUser.photoURL} 
                            alt="Profile" 
                            className="w-8 h-8 rounded-full"
                        />
                    ) : (
                        <FaUser className="w-6 h-6 m-1 text-gray-600 dark:text-gray-300" />
                    )}
                </button>
            </div>
        </header>
    );
};

export default Header;
