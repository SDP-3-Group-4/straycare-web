import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Send, Heart, X, Pencil, Trash2, User } from 'lucide-react';
import { fetchComments, addComment, toggleCommentLike, deleteComment, updateComment } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { avatarOnError } from '../../../constants';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  likesCount: number;
  isLiked: boolean;
  userId: string;
  user: {
    displayName: string;
    photoUrl: string | null;
  };
}

interface CommentSheetProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded?: () => void;
  onCommentDeleted?: () => void;
}

export default function CommentSheet({ postId, isOpen, onClose, onCommentAdded, onCommentDeleted }: CommentSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const loadComments = () => {
    setLoading(true);
    fetchComments(postId, user?.uid)
      .then(setComments)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, postId, user]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!user || !newContent.trim()) return;
    try {
      await addComment(postId, newContent.trim());
      setNewContent('');
      loadComments();
      if (onCommentAdded) onCommentAdded();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) return;
    
    // Optimistic
    setComments(prev => prev.map(c => 
      c.id === commentId 
        ? { ...c, isLiked: !c.isLiked, likesCount: c.isLiked ? c.likesCount - 1 : c.likesCount + 1 }
        : c
    ));
    
    try {
      const res = await toggleCommentLike(commentId);
      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { ...c, isLiked: res.liked, likesCount: res.likesCount }
          : c
      ));
    } catch (e) {
      console.error(e);
      loadComments();
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!user) return;
    if (!confirm('Delete this comment?')) return;
    try {
      await deleteComment(commentId);
      loadComments();
      if (onCommentDeleted) onCommentDeleted();
    } catch (e) {
      console.error(e);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async () => {
    if (!user || !editingId || !editContent.trim()) return;
    try {
      await updateComment(editingId, editContent.trim());
      setEditingId(null);
      setEditContent('');
      loadComments();
    } catch (e) {
      console.error(e);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-[var(--sc-border)] shadow-xl animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center justify-between p-5 border-b border-[var(--sc-border)] bg-gray-50/50 shrink-0">
          <h2 className="text-lg font-bold text-[var(--sc-text-primary)]">Comments</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 p-2 rounded-full transition-colors border border-[var(--sc-border)]">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
             <div className="text-center py-4 text-gray-500">Loading comments...</div>
          ) : comments.length === 0 ? (
             <div className="text-center py-8 text-gray-500">No comments yet. Be the first!</div>
          ) : (
            <div className="flex flex-col gap-4">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                    {(comment.userId === user?.uid ? (user?.photoURL || user?.photoUrl || comment.user.photoUrl) : comment.user.photoUrl) ? (
                      <img 
                        src={comment.userId === user?.uid ? (user?.photoURL || user?.photoUrl || comment.user.photoUrl) || undefined : comment.user.photoUrl || undefined} 
                        alt={comment.user.displayName} 
                        onError={avatarOnError}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <User size={16} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="bg-gray-100 rounded-2xl p-3 inline-block">
                      <div className="flex justify-between items-start gap-4">
                        <span className="font-bold text-[13px]">{comment.user.displayName}</span>
                        {user?.uid === comment.userId && (
                           <div className="flex gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => startEdit(comment)} 
                               className="p-1.5 bg-white text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full shadow-sm transition-all"
                               title="Edit Comment"
                             >
                               <Pencil size={12} strokeWidth={2.5} />
                             </button>
                             <button 
                               onClick={() => handleDelete(comment.id)} 
                               className="p-1.5 bg-white text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full shadow-sm transition-all"
                               title="Delete Comment"
                             >
                               <Trash2 size={12} strokeWidth={2.5} />
                             </button>
                           </div>
                        )}
                      </div>
                      
                      {editingId === comment.id ? (
                        <div className="flex flex-col gap-2 mt-1">
                          <textarea 
                            value={editContent} 
                            onChange={e => setEditContent(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded p-2 text-sm"
                            rows={2}
                          />
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditingId(null)} className="text-xs text-gray-500">Cancel</button>
                            <button onClick={handleSaveEdit} className="text-xs text-[var(--sc-brand-500)] font-bold">Save</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm mt-1 text-gray-800">{comment.content}</p>
                      )}
                    </div>
                    <div className="flex gap-4 items-center mt-1 ml-2 text-[12px] text-gray-500 font-medium">
                      <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                      <button 
                        onClick={() => handleLike(comment.id)}
                        className={`flex items-center gap-1 transition-colors ${comment.isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
                      >
                        <Heart size={14} fill={comment.isLiked ? "currentColor" : "none"} />
                        {comment.likesCount > 0 && comment.likesCount}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[var(--sc-border)] shrink-0 bg-white flex gap-3">
           <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
             {user?.photoURL || user?.photoUrl ? (
               <img 
                 src={user?.photoURL || user?.photoUrl || undefined} 
                 alt={user?.displayName || 'User'}
                 className="w-full h-full object-cover rounded-full"
               />
             ) : (
               <User size={16} className="text-gray-400" />
             )}
           </div>
           <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2">
             <input 
               type="text" 
               placeholder="Write a comment..." 
               className="flex-1 bg-transparent outline-none text-sm"
               value={newContent}
               onChange={e => setNewContent(e.target.value)}
               onKeyDown={e => { if(e.key === 'Enter') handleSend(); }}
             />
             <button 
               onClick={handleSend}
               disabled={!newContent.trim()}
               className="text-[var(--sc-brand-500)] disabled:opacity-50 transition-opacity"
             >
               <Send size={18} />
             </button>
           </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
