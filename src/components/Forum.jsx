import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, getDoc, serverTimestamp } from 'firebase/firestore';
import { 
  MessageSquare, Plus, Search, ThumbsUp, MessageCircle, 
  Share2, Filter, Tag, Users, X, Send
} from 'lucide-react';

const Forum = () => {
  const [discussions, setDiscussions] = useState([]);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: ''
  });
  const [newComments, setNewComments] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showComments, setShowComments] = useState({});
  const [status, setStatus] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'forum'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const discussionsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
          comments: (data.comments || []).map(comment => ({
            ...comment,
            createdAt: comment.createdAt && typeof comment.createdAt.toDate === 'function'
              ? comment.createdAt.toDate()
              : new Date(comment.createdAt || Date.now())
          }))
        };
      });
      setDiscussions(discussionsData);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      getDoc(doc(db, 'users', user.uid)).then((userDoc) => {
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role || userData.Role);
        }
      });
    }
  }, [auth.currentUser]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) {
      setStatus('Please fill in both title and content');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        setStatus('You must be logged in to create a discussion');
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        setStatus('User profile not found');
        return;
      }

      const userData = userDoc.data();
      const username = userData.name || userData.username || userData.Username || userData.displayName || user.email;
      const role = userData.role || userData.Role || 'Member';
      const teamId = userData.teamId || userData.Team || null;

      const discussionData = {
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        author: user.email,
        authorName: username,
        authorRole: role,
        teamId: teamId,
        uid: user.uid,
        createdAt: serverTimestamp(),
        likes: [],
        comments: [],
        closed: false
      };

      const docRef = await addDoc(collection(db, 'forum'), discussionData);
      setNewPost({ title: '', content: '' });
      setShowNewPost(false);
      setStatus('Discussion created successfully!');
    } catch (error) {
      console.error('Error creating discussion:', error);
      setStatus('Error creating discussion. Please try again.');
    }
  };

  const handleLike = async (discussionId) => {
    try {
      const discussionRef = doc(db, 'forum', discussionId);
      const discussion = discussions.find(d => d.id === discussionId);
      
      if (!discussion.likes) {
        discussion.likes = [];
      }

      const updatedLikes = [...discussion.likes];
      const userEmail = auth.currentUser?.email || 'Anonymous';

      if (updatedLikes.includes(userEmail)) {
        updatedLikes.splice(updatedLikes.indexOf(userEmail), 1);
      } else {
        updatedLikes.push(userEmail);
      }

      await updateDoc(discussionRef, {
        likes: updatedLikes
      });
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  const handleCloseDiscussion = async (discussionId) => {
    try {
      await updateDoc(doc(db, 'forum', discussionId), {
        closed: true
      });
      setStatus('Discussion closed successfully.');
    } catch (error) {
      setStatus('Failed to close discussion.');
      console.error('Error closing discussion:', error);
    }
  };

  const formatCommentDate = (createdAt) => {
    if (!createdAt) return '';
    // Firestore Timestamp object
    if (typeof createdAt.toDate === 'function') {
      return createdAt.toDate().toLocaleDateString();
    }
    // ISO string or JS Date
    try {
      return new Date(createdAt).toLocaleDateString();
    } catch {
      return '';
    }
  };

  const handleAddComment = async (discussionId) => {
    if (!newComments[discussionId]?.trim()) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const username = userData.name || userData.username || userData.Username || userData.displayName || user.email;
      const role = userData.role || userData.Role || 'Member';

      const commentData = {
        content: newComments[discussionId].trim(),
        author: user.email,
        authorName: username,
        authorRole: role,
        uid: user.uid,
        createdAt: new Date().toISOString() // Use a plain date string for instant UI update
      };

      // Use arrayUnion for atomic update (Firestore serverTimestamp will be added by backend listener if needed)
      await updateDoc(doc(db, 'forum', discussionId), {
        comments: arrayUnion(commentData)
      });

      setNewComments(prev => ({
        ...prev,
        [discussionId]: ''
      }));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const renderAuthorInfo = (item) => {
    return (
      <div className="flex items-center gap-3 text-lg text-black">
        <span className="font-medium">{item.authorName}</span>
        <span className="px-3 py-1 bg-[#7e3af2]/20 text-[#7e3af2] rounded-full text-base">
          {item.authorRole}
        </span>
        {item.teamId && (
          <span className="px-3 py-1 bg-[#22c55e]/10 text-[#22c55e] rounded-full text-base">
            Team: {item.teamId}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#7e3af2] text-white p-6 rounded-lg mb-6 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">Forum</h1>
          <p className="text-white/80">Join the discussion and share your thoughts</p>
        </div>
        <div className="absolute right-6 top-1/2 transform -translate-y-1/2 opacity-20">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="9" cy="7" r="4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discussions..."
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7e3af2]"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <button
          onClick={() => setShowNewPost(true)}
          className="bg-[#7e3af2] text-white px-4 py-2 rounded-lg hover:bg-[#6025d9] transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Discussion
        </button>
      </div>

      {/* Discussions List */}
      <div className="space-y-4">
        {discussions
          .filter(discussion => !discussion.closed)
          .map((discussion) => (
            <motion.div
              key={discussion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-black mb-2">{discussion.title}</h3>
                    {renderAuthorInfo(discussion)}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <button
                      onClick={() => handleLike(discussion.id)}
                      className="flex items-center gap-2 text-[#7e3af2] hover:text-[#6025d9] transition-colors"
                    >
                      <ThumbsUp className="w-5 h-5 text-[#7e3af2] hover:text-[#6025d9]" />
                      <span className="font-medium">{discussion.likes?.length || 0}</span>
                    </button>
                    <button
                      onClick={() => setShowComments(prev => ({
                        ...prev,
                        [discussion.id]: !prev[discussion.id]
                      }))}
                      className="flex items-center gap-2 text-[#22c55e] hover:text-[#16a34a] transition-colors"
                    >
                      <MessageCircle className="w-5 h-5 text-[#22c55e] hover:text-[#16a34a]" />
                      <span className="font-medium">{discussion.comments?.length || 0}</span>
                    </button>
                    {((auth.currentUser && (auth.currentUser.email === discussion.author || (userRole && userRole.toLowerCase() === 'admin')))) && !discussion.closed && (
                      <button
                        onClick={() => handleCloseDiscussion(discussion.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm ml-4"
                      >
                        Close Discussion
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{discussion.content}</p>

                {showComments[discussion.id] && (
                  <div className="space-y-6">
                    {discussion.comments?.map((comment, index) => (
                      <div key={index} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-[#7e3af2] text-lg">{comment.authorName}</h4>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-500">{comment.authorRole}</span>
                              <span className="px-2 py-1 bg-[#22c55e]/10 text-[#22c55e] text-xs rounded-full">
                                {formatCommentDate(comment.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 text-base leading-relaxed">{comment.content}</p>
                      </div>
                    ))}

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAddComment(discussion.id);
                      }}
                      className="flex gap-3 mt-4"
                    >
                      <input
                        type="text"
                        value={newComments[discussion.id] || ''}
                        onChange={(e) => setNewComments(prev => ({
                          ...prev,
                          [discussion.id]: e.target.value
                        }))}
                        placeholder="Add a comment..."
                        className="flex-1 px-5 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7e3af2] text-lg placeholder:text-gray-400"
                      />
                      <button
                        type="submit"
                        className="px-6 py-3 bg-[#22c55e] text-white rounded-xl hover:bg-[#16a34a] transition-colors text-lg font-semibold"
                      >
                        <Send className="w-6 h-6" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        {discussions
          .filter(discussion => discussion.closed)
          .map((discussion) => (
            <motion.div
              key={discussion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-100 rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors opacity-60 px-4 py-3 mb-2 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-700 text-base truncate max-w-xs block">{discussion.title}</span>
                  <span className="px-2 py-0.5 bg-gray-400 text-white rounded text-xs">Closed</span>
                </div>
                <div className="text-xs text-gray-500">By {discussion.authorName} • {formatCommentDate(discussion.createdAt)}</div>
              </div>
              <button
                className="text-[#7e3af2] hover:text-[#6025d9] text-xs font-semibold ml-4"
                onClick={() => setShowComments(prev => ({ ...prev, [discussion.id]: !prev[discussion.id] }))}
              >
                View Details
              </button>
            </motion.div>
          ))}
        {/* Modal for closed discussion details */}
        {Object.entries(showComments).map(([id, open]) => {
          const discussion = discussions.find(d => d.id === id && d.closed);
          if (!open || !discussion) return null;
          return (
            <div key={id} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowComments(prev => ({ ...prev, [id]: false }))}>
              <div className="bg-white rounded-lg p-6 max-w-lg w-full relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-2">
                  <div className="font-bold text-xl">{discussion.title}</div>
                  <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowComments(prev => ({ ...prev, [id]: false }))}>&times;</button>
                </div>
                <div className="mb-2 text-gray-800">{discussion.content}</div>
                <div className="text-xs text-gray-500 mb-2">By {discussion.authorName} • {formatCommentDate(discussion.createdAt)}</div>
                <div className="italic text-gray-500 mb-2">This discussion is closed.</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Message */}
      {status && (
        <div className="bg-[#22c55e]/10 text-[#22c55e] p-4 rounded-xl text-center">
          <span className="text-lg font-medium">{status}</span>
        </div>
      )}

      {/* New Post Modal */}
      <AnimatePresence>
        {showNewPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowNewPost(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full border border-gray-200 shadow-lg"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-black mb-3">Create New Discussion</h3>
                  <p className="text-gray-600">Share your thoughts with the community</p>
                </div>
                <button
                  onClick={() => setShowNewPost(false)}
                  className="text-[#7e3af2] hover:text-[#6025d9]"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleCreatePost} className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Discussion Title"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className="w-full px-6 py-4 bg-white border border-[#7e3af2]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7e3af2] text-xl placeholder:text-gray-400"
                  />
                </div>
                <textarea
                  placeholder="What's on your mind?"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="w-full px-6 py-4 bg-white border border-[#7e3af2]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7e3af2] h-40 text-lg placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  className="w-full px-8 py-4 bg-gradient-to-r from-[#7e3af2] to-[#6025d9] text-white rounded-xl hover:from-[#6025d9] hover:to-[#501eb3] transition-all text-xl font-semibold shadow-lg hover:shadow-[#7e3af2]/30"
                >
                  Create Discussion
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Forum;