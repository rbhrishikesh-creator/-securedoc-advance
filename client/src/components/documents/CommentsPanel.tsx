import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, User } from 'lucide-react';
import { commentsApi } from '../../api/comments';
import { CommentItem, DocumentItem } from '../../types';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface CommentsPanelProps {
  document: DocumentItem;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({ document }) => {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { socket, joinDocument, leaveDocument } = useSocket();
  const { user } = useAuth();
  const { showToast } = useToast();

  const loadComments = async () => {
    try {
      const res = await commentsApi.list(document._id);
      setComments(res.comments);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadComments();
    joinDocument(document._id);

    if (socket) {
      const handleNewComment = (comment: CommentItem) => {
        setComments((prev) => [...prev, comment]);
      };
      socket.on('comment:added', handleNewComment);

      return () => {
        socket.off('comment:added', handleNewComment);
        leaveDocument(document._id);
      };
    }
  }, [document._id, socket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    try {
      setIsSubmitting(true);
      await commentsApi.add(document._id, newContent.trim());
      setNewContent('');
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Comment Failed',
        message: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await commentsApi.delete(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message,
      });
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <MessageSquare size={18} color="var(--primary)" />
        <span style={{ fontSize: 15, fontWeight: 700 }}>Collaboration Discussion</span>
        <span className="badge badge-indigo" style={{ fontSize: 11 }}>
          {comments.length}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxHeight: 280,
          overflowY: 'auto',
          paddingRight: 6,
        }}
      >
        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>
            No comments yet. Start a real-time discussion on this document.
          </div>
        ) : (
          comments.map((comment) => {
            const author = comment.authorId;
            const isMe = user?.id === author?._id || user?._id === author?._id;

            return (
              <div
                key={comment._id}
                style={{
                  display: 'flex',
                  gap: 10,
                  background: 'var(--bg-secondary)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {author?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{author?.name}</span>
                      {author?.role === 'admin' && <span className="badge badge-indigo" style={{ fontSize: 10, padding: '2px 6px' }}>Admin</span>}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {comment.content}
                  </div>
                </div>

                {(isMe || user?.role === 'admin') && (
                  <button
                    onClick={() => handleDelete(comment._id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 2,
                    }}
                    title="Delete Comment"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          className="input-control"
          placeholder="Write a comment..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          disabled={isSubmitting}
          style={{ padding: '8px 12px', fontSize: 13 }}
        />
        <button
          type="submit"
          className="btn btn-sm btn-primary"
          disabled={!newContent.trim() || isSubmitting}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};
