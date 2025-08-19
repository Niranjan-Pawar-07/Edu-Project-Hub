import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const MeetingScheduler = ({ teamId }) => {
  const { currentUser, role } = useAuth();
  const [meeting, setMeeting] = useState(null);
  const [scheduledFor, setScheduledFor] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!teamId) { setLoading(false); return; }
    setLoading(true);
    const unsub = onSnapshot(doc(db, 'teams', teamId, 'meeting', 'current'), (docSnap) => {
      setMeeting(docSnap.exists() ? docSnap.data() : null);
      setLoading(false);
    }, (err) => {
      setError('Could not load meeting info. Check your permissions.');
      setLoading(false);
    });
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => { unsub(); clearInterval(interval); };
  }, [teamId]);

  const handleSchedule = async (e) => {
    e.preventDefault();
    setError('');
    if (!scheduledFor) {
      setError('Please select a date and time');
      return;
    }
    try {
      await setDoc(doc(db, 'teams', teamId, 'meeting', 'current'), {
        isActive: false,
        scheduledFor,
        startedBy: '',
        startedAt: '',
      });
    } catch (err) {
      setError('Failed to schedule meeting.');
    }
  };

  const handleStart = async () => {
    try {
      await updateDoc(doc(db, 'teams', teamId, 'meeting', 'current'), {
        isActive: true,
        startedBy: currentUser.uid,
        startedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError('Failed to start meeting.');
    }
  };

  const handleEnd = async () => {
    try {
      await updateDoc(doc(db, 'teams', teamId, 'meeting', 'current'), {
        isActive: false,
      });
    } catch (err) {
      setError('Failed to end meeting.');
    }
  };

  const handleRemove = async () => {
    try {
      await deleteDoc(doc(db, 'teams', teamId, 'meeting', 'current'));
      setMeeting(null);
    } catch (err) {
      setError('Failed to remove meeting.');
    }
  };

  const isHost = role === 'teacher' || role === 'teamLeader';
  const canJoin = meeting && meeting.isActive;
  const showStart = isHost && meeting && !meeting.isActive && meeting.scheduledFor && (new Date(meeting.scheduledFor) <= now);

  return (
    <div className="mb-4 w-full">
      <h2 className="text-lg font-semibold mb-2">Team Meeting Scheduler</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {loading ? (
        <div>Loading meeting info...<br/>If this persists, check your Firestore permissions or network.</div>
      ) : (
        <>
          {isHost && (
            <form onSubmit={handleSchedule} className="flex flex-col md:flex-row gap-2 mb-2">
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={e => setScheduledFor(e.target.value)}
                className="border rounded px-2 py-1"
              />
              <button type="submit" className="bg-blue-500 text-white px-4 py-1 rounded">Schedule Meeting</button>
            </form>
          )}
          {meeting && meeting.scheduledFor && (
            <div className="mb-2 text-gray-700">
              <span>Scheduled for: {new Date(meeting.scheduledFor).toLocaleString()}</span>
              {showStart && (
                <button onClick={handleStart} className="ml-4 bg-green-500 text-white px-3 py-1 rounded">Start Meeting</button>
              )}
              {meeting.isActive && isHost && (
                <button onClick={handleEnd} className="ml-4 bg-red-500 text-white px-3 py-1 rounded">End Meeting</button>
              )}
              {isHost && (
                <button onClick={handleRemove} className="ml-4 bg-gray-400 text-white px-3 py-1 rounded">Close & Remove Meeting</button>
              )}
            </div>
          )}
          {!canJoin && !meeting && <div className="text-gray-500">No meeting scheduled yet. Please schedule one above.</div>}
          {!canJoin && meeting && !meeting.isActive && <div className="text-gray-500">No active meeting. Please wait for the host to start the meeting.</div>}
        </>
      )}
    </div>
  );
};

export default MeetingScheduler;
