import React, { useState, useEffect } from 'react';
import { MessageCircle, Heart, Reply, Edit, Trash2, Send } from 'lucide-react';

const CommentsSection = ({ projectId, referenceId, currentUser }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadComments();
  }, [projectId, referenceId, sortBy]);

  const loadComments = async (pageNum = 1) => {
    try {
      const params = new URLSearchParams({
        page: pageNum,
        per_page: 20,
        sort_by: sortBy
      });
      
      if (projectId) params.append('project_id', projectId);
      if (referenceId) params.append('reference_id', referenceId);

      const response = await fetch(`/api/comments?${params}`);
      const data = await response.json();

      if (pageNum === 1) {
        setComments(data.comments || []);
      } else {
        setComments(prev => [...prev, ...(data.comments || [])]);
      }
      
      setHasMore(data.has_next || false);
      setPage(pageNum);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки комментариев:', error);
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: newComment,
          project_id: projectId,
          reference_id: referenceId,
          parent_id: replyTo?.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (replyTo) {
          // Добавляем ответ к родительскому комментарию
          setComments(prev => prev.map(comment => 
            comment.id === replyTo.id 
              ? { ...comment, replies: [...(comment.replies || []), data.comment] }
              : comment
          ));
        } else {
          // Добавляем новый комментарий в начало списка
          setComments(prev => [data.comment, ...prev]);
        }
        setNewComment('');
        setReplyTo(null);
      }
    } catch (error) {
      console.error('Ошибка создания комментария:', error);
    }
  };

  const handleEditComment = async (commentId, newContent) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: newContent })
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => prev.map(comment => 
          comment.id === commentId ? data.comment : comment
        ));
        setEditingComment(null);
      }
    } catch (error) {
      console.error('Ошибка редактирования комментария:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Удалить комментарий?')) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
      }
    } catch (error) {
      console.error('Ошибка удаления комментария:', error);
    }
  };

  const handleLikeComment = async (commentId, isLike = true) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ is_like: isLike })
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, likes_count: data.stats.likes }
            : comment
        ));
      }
    } catch (error) {
      console.error('Ошибка обработки лайка:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    return date.toLocaleDateString('ru-RU');
  };

  const CommentItem = ({ comment, isReply = false }) => (
    <div className={`bg-white rounded-lg p-4 ${isReply ? 'ml-8 mt-2' : 'mb-4'} border border-gray-200`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {comment.user_name?.charAt(0) || 'U'}
          </div>
          <div>
            <span className="font-medium text-gray-900">{comment.user_name}</span>
            <span className="text-gray-500 text-sm ml-2">{formatDate(comment.created_at)}</span>
          </div>
        </div>
        
        {currentUser && currentUser.id === comment.user_id && (
          <div className="flex space-x-1">
            <button
              onClick={() => setEditingComment(comment.id)}
              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => handleDeleteComment(comment.id)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {editingComment === comment.id ? (
        <EditCommentForm
          comment={comment}
          onSave={(content) => handleEditComment(comment.id, content)}
          onCancel={() => setEditingComment(null)}
        />
      ) : (
        <>
          <p className="text-gray-700 mb-3">{comment.content}</p>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleLikeComment(comment.id, true)}
              className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
            >
              <Heart size={16} />
              <span>{comment.likes_count || 0}</span>
            </button>
            
            {!isReply && (
              <button
                onClick={() => setReplyTo(comment)}
                className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
              >
                <Reply size={16} />
                <span>Ответить</span>
              </button>
            )}
          </div>
        </>
      )}

      {/* Ответы на комментарий */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} isReply={true} />
          ))}
        </div>
      )}
    </div>
  );

  const EditCommentForm = ({ comment, onSave, onCancel }) => {
    const [content, setContent] = useState(comment.content);

    const handleSubmit = (e) => {
      e.preventDefault();
      if (content.trim()) {
        onSave(content);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          rows="3"
          required
        />
        <div className="flex space-x-2">
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Сохранить
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Отмена
          </button>
        </div>
      </form>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок секции */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <MessageCircle className="mr-2" size={24} />
          Комментарии ({comments.length})
        </h3>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
        >
          <option value="created_at">По времени</option>
          <option value="likes_count">По популярности</option>
        </select>
      </div>

      {/* Форма добавления комментария */}
      {currentUser && (
        <form onSubmit={handleSubmitComment} className="bg-gray-50 rounded-lg p-4">
          {replyTo && (
            <div className="mb-3 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
              <p className="text-sm text-blue-700">
                Ответ на комментарий <strong>{replyTo.user_name}</strong>
              </p>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-blue-500 text-sm hover:underline"
              >
                Отменить
              </button>
            </div>
          )}
          
          <div className="flex space-x-3">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {currentUser.first_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyTo ? 'Написать ответ...' : 'Добавить комментарий...'}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="3"
                required
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                  <span>{replyTo ? 'Ответить' : 'Отправить'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Список комментариев */}
      <div>
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>Пока нет комментариев</p>
            <p className="text-sm">Будьте первым, кто оставит комментарий!</p>
          </div>
        ) : (
          <>
            {comments.map(comment => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
            
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={() => loadComments(page + 1)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Загрузить еще
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CommentsSection;

