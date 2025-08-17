import React, { useState, useEffect } from 'react';
import { Heart, ThumbsUp, ThumbsDown } from 'lucide-react';

const LikeButton = ({ 
  type = 'heart', // 'heart', 'thumbs'
  targetType, // 'project', 'reference', 'comment'
  targetId,
  currentUser,
  initialStats = { likes: 0, dislikes: 0 },
  size = 'md' // 'sm', 'md', 'lg'
}) => {
  const [stats, setStats] = useState(initialStats);
  const [userLike, setUserLike] = useState(null); // null, true (like), false (dislike)
  const [loading, setLoading] = useState(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadUserLike();
    }
    loadStats();
  }, [targetId, currentUser]);

  const loadUserLike = async () => {
    try {
      const params = new URLSearchParams();
      params.append(`${targetType}_id`, targetId);

      const response = await fetch(`/api/likes/user?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserLike(data.has_like ? data.is_like : null);
      }
    } catch (error) {
      console.error('Ошибка загрузки лайка пользователя:', error);
    }
  };

  const loadStats = async () => {
    try {
      const params = new URLSearchParams();
      params.append(`${targetType}_id`, targetId);

      const response = await fetch(`/api/likes/stats?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики лайков:', error);
    }
  };

  const handleLike = async (isLike = true) => {
    if (!currentUser || loading) return;

    setLoading(true);
    setAnimated(true);

    try {
      const endpoint = `/api/${targetType}s/${targetId}/like`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ is_like: isLike })
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        
        // Обновляем состояние пользовательского лайка
        if (data.action === 'removed') {
          setUserLike(null);
        } else {
          setUserLike(isLike);
        }
      }
    } catch (error) {
      console.error('Ошибка обработки лайка:', error);
    } finally {
      setLoading(false);
      setTimeout(() => setAnimated(false), 300);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          button: 'p-1',
          icon: 16,
          text: 'text-xs'
        };
      case 'lg':
        return {
          button: 'p-3',
          icon: 24,
          text: 'text-lg'
        };
      default:
        return {
          button: 'p-2',
          icon: 20,
          text: 'text-sm'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  if (type === 'heart') {
    return (
      <button
        onClick={() => handleLike(true)}
        disabled={loading || !currentUser}
        className={`
          flex items-center space-x-1 transition-all duration-200
          ${sizeClasses.button}
          ${userLike === true 
            ? 'text-red-500 hover:text-red-600' 
            : 'text-gray-500 hover:text-red-500'
          }
          ${animated ? 'scale-110' : 'scale-100'}
          ${!currentUser ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        `}
        title={currentUser ? 'Нравится' : 'Войдите, чтобы поставить лайк'}
      >
        <Heart 
          size={sizeClasses.icon} 
          fill={userLike === true ? 'currentColor' : 'none'}
          className={animated ? 'animate-pulse' : ''}
        />
        <span className={`${sizeClasses.text} font-medium`}>
          {stats.likes || 0}
        </span>
      </button>
    );
  }

  if (type === 'thumbs') {
    return (
      <div className="flex items-center space-x-2">
        {/* Лайк */}
        <button
          onClick={() => handleLike(true)}
          disabled={loading || !currentUser}
          className={`
            flex items-center space-x-1 transition-all duration-200
            ${sizeClasses.button}
            ${userLike === true 
              ? 'text-green-500 hover:text-green-600' 
              : 'text-gray-500 hover:text-green-500'
            }
            ${animated && userLike === true ? 'scale-110' : 'scale-100'}
            ${!currentUser ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          `}
          title={currentUser ? 'Нравится' : 'Войдите, чтобы поставить лайк'}
        >
          <ThumbsUp 
            size={sizeClasses.icon}
            fill={userLike === true ? 'currentColor' : 'none'}
            className={animated && userLike === true ? 'animate-pulse' : ''}
          />
          <span className={`${sizeClasses.text} font-medium`}>
            {stats.likes || 0}
          </span>
        </button>

        {/* Дизлайк */}
        <button
          onClick={() => handleLike(false)}
          disabled={loading || !currentUser}
          className={`
            flex items-center space-x-1 transition-all duration-200
            ${sizeClasses.button}
            ${userLike === false 
              ? 'text-red-500 hover:text-red-600' 
              : 'text-gray-500 hover:text-red-500'
            }
            ${animated && userLike === false ? 'scale-110' : 'scale-100'}
            ${!currentUser ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          `}
          title={currentUser ? 'Не нравится' : 'Войдите, чтобы поставить дизлайк'}
        >
          <ThumbsDown 
            size={sizeClasses.icon}
            fill={userLike === false ? 'currentColor' : 'none'}
            className={animated && userLike === false ? 'animate-pulse' : ''}
          />
          <span className={`${sizeClasses.text} font-medium`}>
            {stats.dislikes || 0}
          </span>
        </button>
      </div>
    );
  }

  return null;
};

export default LikeButton;

