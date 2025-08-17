import React, { useState, useCallback } from 'react';
import { useSecurity } from '../hooks/useSecurity';
import { Loader2, Shield, AlertCircle } from 'lucide-react';

/**
 * Компонент защищенной формы с автоматической CSRF защитой и валидацией
 */
const SecureForm = ({ 
  children, 
  onSubmit, 
  className = '',
  validateOnChange = true,
  showSecurityIndicator = true,
  ...props 
}) => {
  const { 
    createSecureRequest, 
    validateInput, 
    sanitizeInput, 
    addSecurityAlert,
    isLoading: securityLoading 
  } = useSecurity();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [formData, setFormData] = useState({});

  // Обработка изменений в полях формы
  const handleInputChange = useCallback((event) => {
    const { name, value, type } = event.target;
    
    // Санитизация ввода
    const sanitizedValue = sanitizeInput(value);
    
    // Обновляем данные формы
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));

    // Валидация при изменении (если включена)
    if (validateOnChange) {
      const validation = validateInput(sanitizedValue, type === 'email' ? 'email' : 'text');
      
      setValidationErrors(prev => ({
        ...prev,
        [name]: validation.isValid ? null : validation.message
      }));
    }

    // Вызываем оригинальный обработчик, если есть
    if (event.target.onChange) {
      event.target.onChange(event);
    }
  }, [sanitizeInput, validateInput, validateOnChange]);

  // Обработка отправки формы
  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    
    if (isSubmitting || securityLoading) return;

    try {
      setIsSubmitting(true);

      // Собираем данные формы
      const formDataObj = new FormData(event.target);
      const data = Object.fromEntries(formDataObj.entries());

      // Валидируем все поля
      const errors = {};
      let hasErrors = false;

      for (const [key, value] of Object.entries(data)) {
        const field = event.target.elements[key];
        const fieldType = field?.type === 'email' ? 'email' : 
                         field?.type === 'password' ? 'password' :
                         field?.type === 'tel' ? 'phone' : 'text';
        
        const validation = validateInput(value, fieldType);
        
        if (!validation.isValid) {
          errors[key] = validation.message;
          hasErrors = true;
        }
      }

      setValidationErrors(errors);

      if (hasErrors) {
        addSecurityAlert('warning', 'Ошибки валидации', 'Проверьте правильность заполнения полей');
        return;
      }

      // Санитизируем данные
      const sanitizedData = {};
      for (const [key, value] of Object.entries(data)) {
        sanitizedData[key] = sanitizeInput(value);
      }

      // Вызываем обработчик отправки с защищенным запросом
      if (onSubmit) {
        await onSubmit(sanitizedData, createSecureRequest);
      }

      addSecurityAlert('success', 'Форма отправлена', 'Данные успешно обработаны');

    } catch (error) {
      console.error('Ошибка отправки формы:', error);
      addSecurityAlert('error', 'Ошибка отправки', error.message || 'Произошла ошибка при отправке формы');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, securityLoading, validateInput, sanitizeInput, createSecureRequest, onSubmit, addSecurityAlert]);

  // Клонируем дочерние элементы и добавляем обработчики
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      // Если это input, textarea или select - добавляем обработчики
      if (['input', 'textarea', 'select'].includes(child.type)) {
        const fieldName = child.props.name;
        const hasError = validationErrors[fieldName];

        return React.cloneElement(child, {
          onChange: handleInputChange,
          className: `${child.props.className || ''} ${hasError ? 'border-red-500 focus:border-red-500' : ''}`,
          'aria-invalid': hasError ? 'true' : 'false',
          'aria-describedby': hasError ? `${fieldName}-error` : undefined
        });
      }

      // Рекурсивно обрабатываем вложенные элементы
      if (child.props.children) {
        return React.cloneElement(child, {
          children: React.Children.map(child.props.children, (nestedChild) => {
            if (React.isValidElement(nestedChild) && ['input', 'textarea', 'select'].includes(nestedChild.type)) {
              const fieldName = nestedChild.props.name;
              const hasError = validationErrors[fieldName];

              return React.cloneElement(nestedChild, {
                onChange: handleInputChange,
                className: `${nestedChild.props.className || ''} ${hasError ? 'border-red-500 focus:border-red-500' : ''}`,
                'aria-invalid': hasError ? 'true' : 'false',
                'aria-describedby': hasError ? `${fieldName}-error` : undefined
              });
            }
            return nestedChild;
          })
        });
      }
    }
    return child;
  });

  return (
    <div className="relative">
      {/* Индикатор безопасности */}
      {showSecurityIndicator && (
        <div className="flex items-center space-x-2 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <Shield className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-800">
            Форма защищена CSRF токеном и валидацией
          </span>
          {securityLoading && (
            <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
          )}
        </div>
      )}

      {/* Форма */}
      <form 
        onSubmit={handleSubmit}
        className={`relative ${className}`}
        noValidate
        {...props}
      >
        {enhancedChildren}

        {/* Отображение ошибок валидации */}
        {Object.entries(validationErrors).map(([fieldName, error]) => (
          error && (
            <div 
              key={fieldName}
              id={`${fieldName}-error`}
              className="flex items-center space-x-2 mt-1 text-red-600 text-sm"
              role="alert"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )
        ))}

        {/* Overlay при отправке */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-lg">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-gray-700">Отправка данных...</span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SecureForm;

