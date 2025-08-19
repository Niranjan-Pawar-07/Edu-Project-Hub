import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { serverTimestamp } from 'firebase/firestore';
import emailjs from '@emailjs/browser';

// Initialize EmailJS with your public key
emailjs.init("56KLCrxrKDMWtdlCL");

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [newNotification, setNewNotification] = useState({
    title: '',
    content: '',
    recipientType: 'all',
    selectedTeam: '',
    selectedMembers: [],
    sendEmail: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [userTeamId, setUserTeamId] = useState(null);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        console.log('Initializing data...');
        
        // First fetch user data to get role and team ID
        if (auth.currentUser) {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('User data:', userData);
            setUserRole(userData.role);
            setUserTeamId(userData.teamId);
            
            // If user is a team leader, fetch team members immediately
            if (userData.role === 'teamLeader' && userData.teamId) {
              const teamDoc = await getDoc(doc(db, 'teams', userData.teamId));
              if (teamDoc.exists()) {
                const teamData = teamDoc.data();
                const memberIds = teamData.members || [];
                
                // Add team leader to the list if not already included
                if (!memberIds.includes(auth.currentUser.uid)) {
                  memberIds.push(auth.currentUser.uid);
                }

                // Fetch all member documents in parallel
                const membersPromises = memberIds.map(memberId => 
                  getDoc(doc(db, 'users', memberId))
                );
                const membersDocs = await Promise.all(membersPromises);
                
                // Filter out any non-existent members and set the users state
                const teamMembers = membersDocs
                  .filter(doc => doc.exists())
                  .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                  }));
                
                console.log('Team members:', teamMembers);
                setUsers(teamMembers);
                setTeamMembers(teamMembers);
              }
            }
          }
        }

        // Then fetch other data
        await fetchNotifications();
        await fetchTeams();
        await fetchTeachers();
      } catch (err) {
        console.error('Error initializing data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const fetchTeachers = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
      const querySnapshot = await getDocs(q);
      const teachersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTeachers(teachersList);
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const notificationsList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          readBy: data.readBy || []
        };
      });
      setNotifications(notificationsList);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    }
  };

  const fetchTeams = async () => {
    try {
      let teamsQuery;
      if (userRole === 'teacher') {
        teamsQuery = collection(db, 'teams');
      } else if (userRole === 'teamLeader') {
        teamsQuery = query(collection(db, 'teams'), where('leaderId', '==', auth.currentUser.uid));
      }
      
      if (teamsQuery) {
        const teamsSnapshot = await getDocs(teamsQuery);
        const teamsList = teamsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTeams(teamsList);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      if (userRole === 'teamLeader' && userTeamId) {
        // For team leaders, get their team members
        const teamDoc = await getDoc(doc(db, 'teams', userTeamId));
        if (teamDoc.exists()) {
          const teamData = teamDoc.data();
          const memberIds = teamData.members || [];
          
          // Add team leader to the list if not already included
          if (!memberIds.includes(auth.currentUser.uid)) {
            memberIds.push(auth.currentUser.uid);
          }

          // Fetch all member documents in parallel
          const membersPromises = memberIds.map(memberId => 
            getDoc(doc(db, 'users', memberId))
          );
          const membersDocs = await Promise.all(membersPromises);
          
          // Filter out any non-existent members and set the users state
          const teamMembers = membersDocs
            .filter(doc => doc.exists())
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          
          console.log('Team members:', teamMembers);
          setUsers(teamMembers);
          setTeamMembers(teamMembers);
        }
      } else if (userRole === 'teacher') {
        // For teachers, get all users
        const usersQuery = collection(db, 'users');
        const usersSnapshot = await getDocs(usersQuery);
        const allUsers = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(allUsers);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    }
  };

  const sendEmail = async (recipient, subject, content, senderName) => {
    try {
      console.log('Attempting to send email to:', recipient);
      console.log('Email parameters:', {
        to_email: recipient,
        title: subject,
        name: senderName,
        email: auth.currentUser.email,
        message: content
      });

      const templateParams = {
        to_email: recipient,
        title: subject,
        name: senderName,
        email: auth.currentUser.email,
        message: content
      };

      const response = await emailjs.send(
        "service_uuw6rhn",
        "template_do1hc9f",
        templateParams
      );
      
      console.log('EmailJS response:', response);
      console.log('Email sent successfully to:', recipient);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newNotification.title || !newNotification.content) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      let recipientEmails = [];
      if (userRole === 'teacher') {
        recipientEmails = newNotification.selectedMembers;
      } else if (userRole === 'teamLeader' && userTeamId) {
        recipientEmails = newNotification.selectedMembers;
      }

      console.log('Selected recipients:', recipientEmails);
      console.log('Send email option:', newNotification.sendEmail);

      if (recipientEmails.length === 0) {
        setError('Please select at least one recipient');
        return;
      }

      const notificationData = {
        title: newNotification.title,
        content: newNotification.content,
        sender: auth.currentUser.email,
        senderName: auth.currentUser.displayName || auth.currentUser.email,
        recipientEmails: recipientEmails,
        createdAt: serverTimestamp(),
        authorRole: userRole,
        teamId: userTeamId
      };

      // Save notification to Firestore
      await addDoc(collection(db, 'notifications'), notificationData);
      
      // Send emails if enabled
      if (newNotification.sendEmail) {
        console.log('Starting to send emails to recipients:', recipientEmails);
        for (const recipient of recipientEmails) {
          console.log('Processing email for recipient:', recipient);
          await sendEmail(
            recipient,
            newNotification.title,
            newNotification.content,
            auth.currentUser.displayName || auth.currentUser.email
          );
        }
      }
      
      // Reset form
      setNewNotification({
        title: '',
        content: '',
        selectedMembers: [],
        sendEmail: false
      });
      
      // Refresh notifications list
      await fetchNotifications();
    } catch (err) {
      console.error('Error creating notification:', err);
      setError('Failed to create notification: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecipientTypeChange = (e) => {
    setNewNotification({
      ...newNotification,
      recipientType: e.target.value,
      selectedTeam: '',
      selectedMembers: []
    });
  };

  const handleTeamChange = async (e) => {
    const teamId = e.target.value;
    setNewNotification({
      ...newNotification,
      selectedTeam: teamId
    });
    if (teamId) {
      await fetchUsers();
    }
  };

  const handleMemberSelection = (email) => {
    setNewNotification(prev => {
      const isSelected = prev.selectedMembers.includes(email);
      return {
        ...prev,
        selectedMembers: isSelected
          ? prev.selectedMembers.filter(e => e !== email)
          : [...prev.selectedMembers, email]
      };
    });
  };

  const getAvailableMembers = () => {
    if (userRole === 'teacher') {
      return [...users, ...teachers];
    } else if (userRole === 'teamLeader') {
      return [...users, ...teachers];
    }
    return [];
  };

  // Update the team members useEffect to handle persistence
  useEffect(() => {
    if (teamMembers.length > 0 && userRole === 'teamLeader') {
      setUsers(teamMembers);
    }
  }, [teamMembers, userRole]);

  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      const notificationDoc = await getDoc(notificationRef);
      
      if (notificationDoc.exists()) {
        const currentData = notificationDoc.data();
        const readBy = currentData.readBy || [];
        
        // Add current user to readBy array if not already there
        if (!readBy.includes(auth.currentUser.email)) {
          await updateDoc(notificationRef, {
            readBy: [...readBy, auth.currentUser.email]
          });
          
          // Refresh notifications to show updated read status
          await fetchNotifications();
        }
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gray-100">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-8"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Send Notification</h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mb-8">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Title
              </label>
              <input
                type="text"
                value={newNotification.title}
                onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notification title"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Content
              </label>
              <textarea
                value={newNotification.content}
                onChange={(e) => setNewNotification({ ...newNotification, content: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notification content"
                rows="4"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Select Recipients
              </label>
              <div className="max-h-40 overflow-y-auto border rounded p-2">
                {userRole === 'teamLeader' && (
                  <>
                    <h4 className="font-semibold mb-2">Team Members</h4>
                    {users.map(user => (
                      <div key={user.id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id={user.id}
                          checked={newNotification.selectedMembers.includes(user.email)}
                          onChange={() => handleMemberSelection(user.email)}
                          className="mr-2"
                        />
                        <label htmlFor={user.id}>
                          {user.name || user.email}
                        </label>
                      </div>
                    ))}
                    <h4 className="font-semibold mb-2 mt-4">Teachers</h4>
                    {teachers.map(teacher => (
                      <div key={teacher.id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id={teacher.id}
                          checked={newNotification.selectedMembers.includes(teacher.email)}
                          onChange={() => handleMemberSelection(teacher.email)}
                          className="mr-2"
                        />
                        <label htmlFor={teacher.id}>
                          {teacher.name || teacher.email}
                        </label>
                      </div>
                    ))}
                  </>
                )}
                {userRole === 'teacher' && (
                  <>
                    <h4 className="font-semibold mb-2">All Members</h4>
                    {getAvailableMembers().map(user => (
                      <div key={user.id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id={user.id}
                          checked={newNotification.selectedMembers.includes(user.email)}
                          onChange={() => handleMemberSelection(user.email)}
                          className="mr-2"
                        />
                        <label htmlFor={user.id}>
                          {user.name || user.email}
                        </label>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newNotification.sendEmail}
                  onChange={(e) => setNewNotification({ ...newNotification, sendEmail: e.target.checked })}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="text-gray-700">Send email notifications</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {loading ? 'Sending...' : 'Send Notification'}
            </button>
          </form>

          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-4">Recent Notifications</h3>
            {notifications.map((notification) => (
              <div key={notification.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-lg font-semibold mb-2">{notification.title}</h4>
                <p className="text-gray-700 mb-3 whitespace-pre-wrap">{notification.content}</p>
                <div className="text-sm text-gray-500 mb-2">
                  <span>Sent by {notification.senderName}</span>
                  {notification.createdAt && (
                    <span> • {notification.createdAt.toLocaleDateString()} {notification.createdAt.toLocaleTimeString()}</span>
                  )}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Recipients: </span>
                  {notification.recipientEmails && notification.recipientEmails.length > 0 ? (
                    <span>{notification.recipientEmails.join(', ')}</span>
                  ) : (
                    <span>No recipients specified</span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Read by: </span>
                  {notification.readBy && notification.readBy.length > 0 ? (
                    <span>{notification.readBy.length} of {notification.recipientEmails.length} recipients</span>
                  ) : (
                    <span>No recipients have read this yet</span>
                  )}
                </div>
                {notification.recipientEmails.includes(auth.currentUser.email) && 
                 !notification.readBy?.includes(auth.currentUser.email) && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="mt-2 text-sm text-blue-500 hover:text-blue-700"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            ))}
            {notifications.length === 0 && (
              <p className="text-gray-500 text-center py-4">No notifications available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification; 