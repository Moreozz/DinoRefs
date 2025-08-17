import React, { useState, useRef, useEffect } from 'react';
import { Loader2, ImageOff } from 'lucide-react';

/**
 * Компонент для ленивой загрузки изображений с плейсхолдерами и обработкой ошибок
 */
const LazyImage = ({
  src,
  alt = '',
  className = '',
  placeholderClassName = '',
  errorClassName = '',
  width,
  height,
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc,
  showLoader = true,
  showErrorIcon = true,
  threshold = 0.1,
  rootMargin = '50px',
  ...props
}) => {
  const [imageState, setImageState] = useState('loading'); // 'loading', 'loaded', 'error'
  const [imageSrc, setImageSrc] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Максимальное количество попыток загрузки
  const maxRetries = 3;

  // Intersection Observer для ленивой загрузки
  useEffect(() => {
    if (!imgRef.current || loading !== 'lazy') {
      // Если не lazy loading, загружаем сразу
      setImageSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(imgRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, loading, threshold, rootMargin]);

  // Обработка загрузки изображения
  const handleLoad = (event) => {
    setImageState('loaded');
    setRetryCount(0);
    
    if (onLoad) {
      onLoad(event);
    }
  };

  // Обработка ошибки загрузки
  const handleError = (event) => {
    if (retryCount < maxRetries) {
      // Повторная попытка загрузки
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setImageState('loading');
        
        // Принудительно перезагружаем изображение
        if (imgRef.current) {
          imgRef.current.src = `${src}?retry=${retryCount + 1}`;
        }
      }, 1000 * (retryCount + 1)); // Увеличиваем задержку с каждой попыткой
    } else {
      // Используем fallback или показываем ошибку
      if (fallbackSrc && fallbackSrc !== src) {
        setImageSrc(fallbackSrc);
        setRetryCount(0);
      } else {
        setImageState('error');
      }
    }

    if (onError) {
      onError(event);
    }
  };

  // Повторная попытка загрузки
  const retryLoad = () => {
    setImageState('loading');
    setRetryCount(0);
    setImageSrc(`${src}?retry=${Date.now()}`);
  };

  // Базовые стили для контейнера
  const containerStyles = {
    width: width || 'auto',
    height: height || 'auto',
    display: 'inline-block',
    position: 'relative',
    overflow: 'hidden'
  };

  // Стили для плейсхолдера
  const placeholderStyles = `
    flex items-center justify-center bg-gray-100 text-gray-400
    ${placeholderClassName}
  `;

  // Стили для ошибки
  const errorStyles = `
    flex flex-col items-center justify-center bg-gray-50 text-gray-500 border-2 border-dashed border-gray-300
    ${errorClassName}
  `;

  // Если изображение еще не начало загружаться (lazy loading)
  if (!imageSrc) {
    return (
      <div
        ref={imgRef}
        className={`${placeholderStyles} ${className}`}
        style={containerStyles}
        {...props}
      >
        {showLoader && (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
            <span className="text-xs">Загрузка...</span>
          </div>
        )}
      </div>
    );
  }

  // Состояние загрузки
  if (imageState === 'loading') {
    return (
      <div
        className={`${placeholderStyles} ${className}`}
        style={containerStyles}
        {...props}
      >
        {showLoader && (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xs">
              {retryCount > 0 ? `Попытка ${retryCount + 1}/${maxRetries + 1}` : 'Загрузка...'}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Состояние ошибки
  if (imageState === 'error') {
    return (
      <div
        className={`${errorStyles} ${className}`}
        style={containerStyles}
        {...props}
      >
        {showErrorIcon && (
          <div className="flex flex-col items-center space-y-2">
            <ImageOff className="w-8 h-8" />
            <span className="text-xs text-center">
              Не удалось загрузить изображение
            </span>
            <button
              onClick={retryLoad}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Повторить
            </button>
          </div>
        )}
      </div>
    );
  }

  // Успешно загруженное изображение
  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`transition-opacity duration-300 ${className}`}
      style={{
        width: width || 'auto',
        height: height || 'auto',
        opacity: imageState === 'loaded' ? 1 : 0
      }}
      onLoad={handleLoad}
      onError={handleError}
      loading={loading}
      {...props}
    />
  );
};

/**
 * Компонент для ленивой загрузки любого контента
 */
export const LazyContent = ({
  children,
  fallback = null,
  threshold = 0.1,
  rootMargin = '50px',
  className = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoaded) {
            setIsVisible(true);
            setIsLoaded(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, isLoaded]);

  return (
    <div ref={elementRef} className={className} {...props}>
      {isVisible ? children : fallback}
    </div>
  );
};

/**
 * HOC для ленивой загрузки компонентов
 */
export const withLazyLoading = (WrappedComponent, fallback = null) => {
  return React.forwardRef((props, ref) => {
    return (
      <LazyContent fallback={fallback}>
        <WrappedComponent {...props} ref={ref} />
      </LazyContent>
    );
  });
};

export default LazyImage;

