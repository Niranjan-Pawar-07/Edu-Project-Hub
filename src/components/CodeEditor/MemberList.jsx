import React from 'react';

const MemberList = ({ members }) => {
  return (
    <div className="p-2 h-full">
      <h3 className="text-lg font-semibold mb-2">Active Members</h3>
      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.id} className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm">{member.name}</span>
            {member.isTyping && (
              <span className="text-xs text-gray-500">typing...</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemberList; 