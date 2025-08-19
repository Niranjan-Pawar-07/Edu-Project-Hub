import React from "react";
import Sidebar from "./Sidebar"; // ✅ Persistent Sidebar
import { Outlet } from "react-router-dom";

const Layout = () => {
    return (
        <div className="min-h-screen flex bg-gray-100">
            <Sidebar /> {/* ✅ Sidebar always visible */}
            <main className="flex-1 p-6">
                <Outlet /> {/* ✅ Dynamically loads page content */}
            </main>
        </div>
    );
};

export default Layout;
