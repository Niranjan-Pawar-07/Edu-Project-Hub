import React, { useEffect, useState } from 'react';

// Jitsi Meet embed (no signup required, works for any room name)
function getJitsiMeetingUrl(teamId) {
  // Use a unique, safe room name per team
  const safeRoom = encodeURIComponent(`project-team-${teamId}`);
  return `https://meet.jit.si/${safeRoom}#userInfo.displayName=Team%20Member`;
}

const VideoConference = ({ teamId }) => {
  const [meetingUrl, setMeetingUrl] = useState('');

  useEffect(() => {
    if (teamId) {
      setMeetingUrl(getJitsiMeetingUrl(teamId));
    }
  }, [teamId]);

  if (!teamId) {
    return <div className="text-red-500">No team selected for video conference.</div>;
  }

  return (
    <div className="w-full h-[400px] flex flex-col items-center justify-center mt-4">
      <h2 className="text-lg font-semibold mb-2">Team Video Conference</h2>
      <iframe
        title="Team Video Conference"
        src={meetingUrl}
        allow="camera; microphone; fullscreen; speaker; display-capture"
        className="w-full h-[350px] rounded-lg border"
        style={{ minHeight: 350 }}
      ></iframe>
      <div className="text-xs mt-2 text-gray-500">
        Only members of this team should join this meeting room.
      </div>
    </div>
  );
};

export default VideoConference;
