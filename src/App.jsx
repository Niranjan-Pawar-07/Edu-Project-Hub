import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FirebaseProvider } from './contexts/FirebaseContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Teams from './components/Teams';
import TeamDetails from './components/TeamDetails';
// import TeacherLeaderChat from './components/TeacherLeaderChat';
import PrivateRoute from './components/PrivateRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import Forum from './components/Forum';
import Notice from './components/Notice';
import Profile from './components/Profile';
import CreateTeam from './components/CreateTeam';
import FileSharing from './components/FileSharing';
import RoleSelection from './components/RoleSelection';
import GeminiPage from "./pages/GeminiPage";
import { EditorProvider } from "./contexts/EditorContext";
import NewCodeEditor from "./components/CodeEditor/NewCodeEditor";

const AppContent = () => {
  const { currentUser, isFirstLogin } = useAuth();
  const location = useLocation();

  // Hide sidebar on login and register pages
  const showSidebar = currentUser && !['/login', '/register'].includes(location.pathname);

  // Get current page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'MiniProject Manager';
    if (path === '/teams') return 'Teams';
    if (path.startsWith('/team/')) return 'Team Details';
    if (path === '/forum') return 'Forum';
    if (path === '/notices') return 'Notices';
    if (path === '/code-editor') return 'Code Editor';
    if (path === '/gemini') return 'Gemini AI';
    if (path === '/profile') return 'Profile';
    if (path === '/create-team') return 'Create Team';
    return 'MiniProject Manager';
  };

  // Redirect to role selection if it's first login
  if (currentUser && isFirstLogin) {
    return <Navigate to="/role-selection" />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {showSidebar && <Sidebar />}
      <main className={`flex-1 ${showSidebar ? 'ml-64' : ''} transition-all duration-300 flex flex-col`}>
        {showSidebar && <Header title={getPageTitle()} />}
        <div className="p-4 md:p-6 flex-grow">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/role-selection" element={<RoleSelection />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/teams"
              element={
                <PrivateRoute>
                  <Teams />
                </PrivateRoute>
              }
            />
            <Route
              path="/team/:teamId"
              element={
                <PrivateRoute>
                  <TeamDetails />
                </PrivateRoute>
              }
            />
            {/* Temporarily removed TeacherLeaderChat route
            <Route
              path="/teacher-leader-chat"
              element={
                <PrivateRoute>
                  <TeacherLeaderChat />
                </PrivateRoute>
              }
            />
            */}
            <Route
              path="/forum"
              element={
                <PrivateRoute>
                  <Forum />
                </PrivateRoute>
              }
            />
            <Route
              path="/notices"
              element={
                <PrivateRoute>
                  <Notice />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-team"
              element={
                <PrivateRoute>
                  <CreateTeam />
                </PrivateRoute>
              }
            />
            <Route
              path="/file-sharing"
              element={
                <PrivateRoute>
                  <FileSharing />
                </PrivateRoute>
              }
            />


              {/* Code Editor Route with EditorProvider wrapper */}
            <Route
              path="/code-editor"
              element={
                <PrivateRoute>
                  <EditorProvider>
                    <div className="h-screen flex flex-col">
                      <NewCodeEditor teamId="team1" />
                    </div>
                  </EditorProvider>
                </PrivateRoute>
              }
            />

              
              <Route
                path="/gemini"
                element={
                  <PrivateRoute>
                    <GeminiPage />
                  </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <FirebaseProvider>
        <ThemeProvider>
          <Router>
            <AppContent />
          </Router>
        </ThemeProvider>
      </FirebaseProvider>
    </AuthProvider>
  );
};

export default App;
