import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db, googleProvider } from '../firebase';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'teacher',
    });

    const [showRoleSelection, setShowRoleSelection] = useState(false);
    const [googleUser, setGoogleUser] = useState(null);

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { email, password, confirmPassword, role } = formData;

        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email,
                role,
            });

            alert('Registration successful! Redirecting to login...');
            navigate('/login');
        } catch (error) {
            console.error('Error registering:', error);
            alert(error.message);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                alert('Google Sign-In successful! Redirecting to dashboard...');
                navigate('/dashboard');
                return;
            }

            setGoogleUser(user);
            setShowRoleSelection(true);
        } catch (error) {
            console.error('Error with Google Sign-In:', error);
            alert(error.message);
        }
    };

    const saveGoogleUserRole = async (selectedRole) => {
        if (!googleUser) return;

        await setDoc(doc(db, 'users', googleUser.uid), {
            uid: googleUser.uid,
            email: googleUser.email,
            role: selectedRole,
        });

        alert('Google Registration successful! Redirecting to dashboard...');
        navigate('/dashboard');
    };

    return (
        <div className="flex items-center justify-center min-h-screen relative overflow-hidden">
            <div className="animated-bg" />
            <div className="auth-glass w-96 p-8">
                <h2 className="text-3xl font-extrabold mb-4 text-center text-gray-900 drop-shadow">Register</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Email" className="w-full p-2 border border-gray-300 rounded bg-white/80" />
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Password" className="w-full p-2 border border-gray-300 rounded bg-white/80" />
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="Confirm Password" className="w-full p-2 border border-gray-300 rounded bg-white/80" />
                    <select name="role" value={formData.role} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded bg-white/80">
                        <option value="teacher">Teacher</option>
                        <option value="teamLeader">Team Leader</option>
                        <option value="teamMember">Team Member</option>
                    </select>
                    <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition shadow-lg">Register</button>
                </form>
                <button onClick={handleGoogleSignIn} className="w-full mt-4 bg-red-500 text-white p-2 rounded hover:bg-red-600 transition shadow">Sign in with Google</button>
                <p className="text-center mt-4 text-gray-700 drop-shadow">Already registered? <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold underline">Log in here</Link></p>
                {showRoleSelection && (
                    <div className="mt-4 p-4 border border-gray-300 rounded bg-gray-50/80">
                        <h3 className="text-lg font-bold">Select Your Role</h3>
                        <select onChange={(e) => saveGoogleUserRole(e.target.value)} className="w-full p-2 mt-2 border border-gray-300 rounded bg-white/80">
                            <option value="">-- Select Role --</option>
                            <option value="teacher">Teacher</option>
                            <option value="teamLeader">Team Leader</option>
                            <option value="teamMember">Team Member</option>
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Register;
