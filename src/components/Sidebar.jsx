import React, { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { auth } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { FaBars, FaTimes, FaHome, FaUsers, FaComments, FaBell, FaCode, FaRobot, FaUser, FaSignOutAlt } from "react-icons/fa";

const Sidebar = () => {
    const navigate = useNavigate();
    const { role } = useAuth();
    const [isOpen, setIsOpen] = useState(true);

    const handleLogout = async () => {
        await auth.signOut();
        navigate("/login");
    };

    const menuItems = {
        teacher: [
            { name: "Dashboard", path: "/", icon: <FaHome className="text-lg" /> },
            { name: "Teams", path: "/teams", icon: <FaUsers className="text-lg" /> },
            { name: "Forum", path: "/forum", icon: <FaComments className="text-lg" /> },
            { name: "Notices", path: "/notices", icon: <FaBell className="text-lg" /> },
            { name: "Code Editor", path: "/code-editor", icon: <FaCode className="text-lg" /> },
            { name: "Gemini AI", path: "/gemini", icon: <FaRobot className="text-lg" /> },
            { name: "Profile", path: "/profile", icon: <FaUser className="text-lg" /> },
        ],
        teamLeader: [
            { name: "Dashboard", path: "/", icon: <FaHome className="text-lg" /> },
            { name: "Create Team", path: "/create-team", icon: <FaUsers className="text-lg" /> },
            { name: "My Team", path: "/teams", icon: <FaUsers className="text-lg" /> },
            { name: "Forum", path: "/forum", icon: <FaComments className="text-lg" /> },
            { name: "Notices", path: "/notices", icon: <FaBell className="text-lg" /> },
            { name: "Code Editor", path: "/code-editor", icon: <FaCode className="text-lg" /> },
            { name: "Gemini AI", path: "/gemini", icon: <FaRobot className="text-lg" /> },
            { name: "Profile", path: "/profile", icon: <FaUser className="text-lg" /> },
        ],
        teamMember: [
            { name: "Dashboard", path: "/", icon: <FaHome className="text-lg" /> },
            { name: "My Team", path: "/teams", icon: <FaUsers className="text-lg" /> },
            { name: "Forum", path: "/forum", icon: <FaComments className="text-lg" /> },
            { name: "Notices", path: "/notices", icon: <FaBell className="text-lg" /> },
            { name: "Code Editor", path: "/code-editor", icon: <FaCode className="text-lg" /> },
            { name: "Gemini AI", path: "/gemini", icon: <FaRobot className="text-lg" /> },
            { name: "Profile", path: "/profile", icon: <FaUser className="text-lg" /> },
        ],
    };

    if (role === null) {
        return (
            <aside className={`fixed left-0 top-0 h-full bg-[#7e3af2] text-white p-5 transition-all duration-300 ${isOpen ? 'w-64' : 'w-0'}`}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold">Loading menu...</h2>
                </div>
            </aside>
        );
    }

    if (role === "unknown") {
        return (
            <aside className={`fixed left-0 top-0 h-full bg-[#7e3af2] text-white p-5 transition-all duration-300 ${isOpen ? 'w-64' : 'w-0'}`}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold">No role assigned</h2>
                </div>
                <button onClick={handleLogout} className="w-full mt-5 bg-red-500 p-2 rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center justify-center">
                    <FaSignOutAlt className="mr-2" />
                    Logout
                </button>
            </aside>
        );
    }

    return (
        <>
            {/* Floating Toggle Button - Always visible when sidebar is closed */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed top-4 left-4 z-50 p-3 rounded-full bg-[#7e3af2] text-white hover:bg-[#6025d9] transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
                >
                    <FaBars className="w-5 h-5" />
                </button>
            )}

            {/* Sidebar */}
            <aside className={`fixed left-0 top-0 h-full bg-[#7e3af2] text-white transition-all duration-300 ${isOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
                {/* Logo and Title */}
                <div className="flex items-center p-4 mb-6">
                    <div className="mr-2">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold">EduProject Hub</h1>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="ml-auto p-1 rounded-full hover:bg-white/10 transition-all duration-300"
                    >
                        <FaTimes className="w-5 h-5 text-white" />
                    </button>
                </div>

                <ul className="space-y-1 px-2">
                    {menuItems[role]?.map((item, index) => (
                        <li key={index}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) => 
                                    `flex items-center p-3 rounded-lg transition-all duration-200 ${
                                        isActive ? 'bg-white/10 font-medium' : 'hover:bg-white/5'
                                    }`
                                }
                            >
                                <span className="w-6 h-6 flex items-center justify-center mr-3">
                                    {item.icon}
                                </span>
                                <span>{item.name}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>

                <div className="absolute bottom-4 left-0 right-0 px-4">
                    <button
                        onClick={handleLogout}
                        className="w-full p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200 flex items-center justify-center"
                    >
                        <FaSignOutAlt className="mr-2" />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
