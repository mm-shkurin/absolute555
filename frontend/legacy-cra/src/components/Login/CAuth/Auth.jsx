import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Cookies from "js-cookie";
import "./../CAuth/Auth.scss";
import api , { loginWithTelegram }from './../../../api/api.js';

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(true);
  const [showTelegramButton, setShowTelegramButton] = useState(false);
  const navigate = useNavigate();
  const telegramContainerRef = useRef(null);
  const telegramButtonRef = useRef(null);
  const scriptRef = useRef(null);
  const isMountedRef = useRef(true);

  // Создаем контейнер для Telegram Widget
  useEffect(() => {
    // Удаляем существующий контейнер, если он есть
    const existingContainer = document.getElementById('telegram-login-container');
    if (existingContainer) {
      try {
        existingContainer.parentNode.removeChild(existingContainer);
      } catch (error) {
        console.warn("Ошибка при удалении существующего контейнера:", error);
      }
    }

    return () => {
      // Очищаем контейнер при размонтировании
      const container = document.getElementById('telegram-login-container');
      if (container && container.parentNode) {
        try {
          container.parentNode.removeChild(container);
        } catch (error) {
          console.warn("Ошибка при удалении контейнера:", error);
        }
      }
    };
  }, []);

  // Обработчик Telegram-авторизации
  useEffect(() => {
    isMountedRef.current = true;

    // Создаем глобальную функцию для обработки авторизации
    window.onTelegramAuth = async (user) => {
      if (!isMountedRef.current) return;
      
      try {
        const success = await loginWithTelegram(user);
        if (success && isMountedRef.current) {
          // Перенаправляем в профиль после Telegram авторизации
          navigate("/my-profile");
        }
      } catch (error) {
        console.error("Ошибка Telegram авторизации:", error);
        if (isMountedRef.current) {
          setMessage("Ошибка авторизации через Telegram. Попробуйте еще раз.");
        }
      }
    };

    const loadTelegramWidget = () => {
      if (!isMountedRef.current) return;
      
      // Проверяем, есть ли уже загруженный виджет
      if (window.Telegram && window.Telegram.Login) {
        console.log("Telegram Widget уже загружен");
        setTelegramLoading(false);
        setShowTelegramButton(true);
        return;
      }

      // Создаем новый скрипт
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.setAttribute("data-telegram-login", "absolutereg_bot");
      script.setAttribute("data-size", "large");
      script.setAttribute("data-request-access", "write");
      script.setAttribute("data-userpic", "false");
      script.setAttribute("data-onauth", "onTelegramAuth(user)");

      script.onload = () => {
        console.log("Telegram Widget загружен успешно");
        console.log("Telegram объект:", window.Telegram);
        if (isMountedRef.current) {
          setTelegramLoading(false);
          setShowTelegramButton(true);
        }
      };

      script.onerror = (error) => {
        console.error("Ошибка загрузки Telegram Widget:", error);
        if (isMountedRef.current) {
          setMessage("Не удалось загрузить кнопку Telegram. Попробуйте обновить страницу.");
          setTelegramLoading(false);
          setShowTelegramButton(false);
        }
      };

      // Сохраняем ссылку на скрипт
      scriptRef.current = script;
      
      // Добавляем скрипт в head документа
      try {
        document.head.appendChild(script);
      } catch (error) {
        console.warn("Ошибка при добавлении скрипта:", error);
        setTelegramLoading(false);
        setShowTelegramButton(false);
      }
    };

    // Загружаем виджет с небольшой задержкой
    const timer = setTimeout(loadTelegramWidget, 100);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
      
      // Удаляем глобальную функцию
      delete window.onTelegramAuth;
      
      // Безопасно удаляем скрипт
      if (scriptRef.current && scriptRef.current.parentNode) {
        try {
          scriptRef.current.parentNode.removeChild(scriptRef.current);
        } catch (error) {
          console.warn("Ошибка при удалении Telegram скрипта:", error);
        }
      }
    };
  }, [navigate]);

  // Инициализируем виджет после рендера
  useEffect(() => {
    if (showTelegramButton && window.Telegram && window.Telegram.Login && telegramButtonRef.current) {
      console.log("Попытка инициализации виджета через ref");
      
      const container = telegramButtonRef.current;
      console.log("Контейнер найден через ref:", container);
      
      // Проверяем, не создан ли уже виджет
      const existingScript = container.querySelector('script[src*="telegram-widget.js"]');
      if (existingScript) {
        console.log("Виджет уже создан, пропускаем");
        return;
      }
      
      // Очищаем контейнер
      container.innerHTML = '';
      
      // Создаем div для виджета
      const widgetDiv = document.createElement('div');
      widgetDiv.id = 'telegram-login-widget';
      widgetDiv.setAttribute('data-telegram-login', 'absolutereg_bot');
      widgetDiv.setAttribute('data-size', 'large');
      widgetDiv.setAttribute('data-request-access', 'write');
      widgetDiv.setAttribute('data-userpic', 'false');
      widgetDiv.setAttribute('data-onauth', 'onTelegramAuth(user)');
      widgetDiv.setAttribute('data-radius', '8');
      widgetDiv.setAttribute('data-lang', 'ru');
      
      console.log("Создан div для виджета:", widgetDiv.outerHTML);
      
      container.appendChild(widgetDiv);
      
      // Попробуем использовать уже загруженный Telegram API
      console.log("Проверяем, есть ли уже загруженный Telegram API");
      
      if (window.Telegram && window.Telegram.Login && window.Telegram.Login.init) {
        console.log("Используем уже загруженный Telegram API");
        
        try {
          window.Telegram.Login.init({
            data_telegram_login: 'absolutereg_bot',
            data_size: 'large',
            data_request_access: 'write',
            data_userpic: 'false',
            data_onauth: 'onTelegramAuth(user)',
            data_radius: '8',
            data_lang: 'ru',
            data_origin: 'https://absoluteomsk.ru'
          }, widgetDiv);
          
          console.log("Виджет инициализирован через существующий API");
          
          // Проверяем результат
          setTimeout(() => {
            if (widgetDiv.children.length > 0) {
              console.log("Виджет успешно создан через существующий API");
            } else {
              console.log("Виджет не создался через существующий API");
            }
          }, 1000);
          
        } catch (error) {
          console.error("Ошибка инициализации через существующий API:", error);
        }
      } else {
        console.log("Telegram API не найден, используем стандартный способ");
        
        // Создаем стандартный HTML для виджета
        const widgetHTML = `
          <div 
            data-telegram-login="absolutereg_bot"
            data-size="large"
            data-request-access="write"
            data-userpic="false"
            data-onauth="onTelegramAuth(user)"
            data-radius="8"
            data-lang="ru"
            data-origin="https://absoluteomsk.ru"
          ></div>
        `;
        
        widgetDiv.innerHTML = widgetHTML;
        
        // Создаем скрипт для инициализации
        const widgetScript = document.createElement('script');
        widgetScript.async = true;
        widgetScript.src = 'https://telegram.org/js/telegram-widget.js?22';
        
        console.log("Создаем скрипт для виджета:", widgetScript.src);
        
        widgetScript.onload = () => {
          console.log("Telegram виджет скрипт загружен");
          
          // Проверяем сразу после загрузки
          setTimeout(() => {
            const widgetElement = document.getElementById('telegram-login-widget');
            console.log("Проверяем виджет сразу после загрузки скрипта");
            console.log("Элемент виджета:", widgetElement);
            console.log("Содержимое виджета:", widgetElement ? widgetElement.innerHTML : 'null');
          }, 100);
          
          // Проверяем результат через некоторое время
          setTimeout(() => {
            const widgetElement = document.getElementById('telegram-login-widget');
            console.log("Проверяем виджет через 1000мс");
            console.log("Элемент виджета:", widgetElement);
            
            if (widgetElement) {
              console.log("Количество дочерних элементов:", widgetElement.children.length);
              console.log("Содержимое виджета:", widgetElement.innerHTML);
              console.log("Атрибуты виджета:", {
                'data-telegram-login': widgetElement.getAttribute('data-telegram-login'),
                'data-size': widgetElement.getAttribute('data-size'),
                'data-request-access': widgetElement.getAttribute('data-request-access'),
                'data-origin': widgetElement.getAttribute('data-origin')
              });
              
              // Проверяем, есть ли ошибки в консоли
              console.log("Проверяем наличие ошибок в консоли...");
              
              if (widgetElement.children.length > 0) {
                console.log("Telegram виджет успешно создан");
              } else {
                console.log("Telegram виджет не создался - нет дочерних элементов");
                console.log("Возможные причины:");
                console.log("1. Бот не настроен в BotFather для домена absoluteomsk.ru");
                console.log("2. Бот не поддерживает Telegram Login Widget");
                console.log("3. Проблемы с CORS или блокировкой");
                
                // Попробуем создать альтернативный виджет через iframe
                console.log("Пробуем создать альтернативный виджет");
                const iframe = document.createElement('iframe');
                iframe.src = `https://oauth.telegram.org/auth?bot_id=absolutereg_bot&origin=${encodeURIComponent('https://absoluteomsk.ru')}&request_access=write&return_to=${encodeURIComponent(window.location.href)}`;
                iframe.style.width = '100%';
                iframe.style.height = '40px';
                iframe.style.border = 'none';
                iframe.style.borderRadius = '8px';
                
                widgetElement.appendChild(iframe);
                console.log("Альтернативный виджет создан через iframe");
              }
            } else {
              console.log("Telegram виджет не найден в DOM");
            }
          }, 1000);
        };
        
        widgetScript.onerror = (error) => {
          console.error("Ошибка загрузки Telegram виджета:", error);
          console.log("Пробуем создать альтернативный виджет из-за ошибки загрузки скрипта");
          
          const widgetElement = document.getElementById('telegram-login-widget');
          if (widgetElement) {
            const iframe = document.createElement('iframe');
            iframe.src = `https://oauth.telegram.org/auth?bot_id=absolutereg_bot&origin=${encodeURIComponent('https://absoluteomsk.ru')}&request_access=write&return_to=${encodeURIComponent(window.location.href)}`;
            iframe.style.width = '100%';
            iframe.style.height = '40px';
            iframe.style.border = 'none';
            iframe.style.borderRadius = '8px';
            
            widgetElement.appendChild(iframe);
            console.log("Альтернативный виджет создан через iframe из-за ошибки");
          }
        };
        
        try {
          container.appendChild(widgetScript);
          console.log("Скрипт добавлен в DOM");
          
          // Добавляем таймаут для скрипта
          setTimeout(() => {
            console.log("Проверяем загрузку скрипта через 3 секунды");
            if (window.Telegram && window.Telegram.Login) {
              console.log("Telegram API доступен после загрузки скрипта");
            } else {
              console.log("Telegram API не доступен, создаем альтернативный виджет");
              const widgetElement = document.getElementById('telegram-login-widget');
              if (widgetElement && widgetElement.children.length === 0) {
                const iframe = document.createElement('iframe');
                iframe.src = `https://oauth.telegram.org/auth?bot_id=absolutereg_bot&origin=${encodeURIComponent('https://absoluteomsk.ru')}&request_access=write&return_to=${encodeURIComponent(window.location.href)}`;
                iframe.style.width = '100%';
                iframe.style.height = '40px';
                iframe.style.border = 'none';
                iframe.style.borderRadius = '8px';
                
                widgetElement.appendChild(iframe);
                console.log("Альтернативный виджет создан через таймаут");
              }
            }
          }, 3000);
          
        } catch (error) {
          console.error("Ошибка при добавлении скрипта в DOM:", error);
        }
        
        console.log("Виджет создан в контейнере через ref");
      }
    }
  }, [showTelegramButton]);

  const handleChange = useCallback((e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await api.post("user/auth/jwt/create/", formData);
      const { access, refresh } = response.data;

      Cookies.set("access", access, { expires: 1, secure: true, sameSite: "Strict" });
      Cookies.set("refresh", refresh, { expires: 7, secure: true, sameSite: "Strict" });

      setMessage("Авторизация успешна!");
      setLoading(false);
      // Перенаправляем в профиль после авторизации
      navigate("/my-profile");
    } catch (error) {
      setMessage("Ошибка авторизации. Проверьте логин и пароль.");
      setLoading(false);
      setFormData((prev) => ({ ...prev, password: "" }));
    }
  };

  // Рендерим Telegram Widget
  const renderTelegramWidget = () => {
    return (
      <div ref={telegramContainerRef} id="telegram-login-container" style={{ margin: '10px 0', border: '1px solid #ccc', padding: '10px' }}>
        {telegramLoading && <p>Загрузка Telegram кнопки...</p>}
        {showTelegramButton && (
          <div 
            ref={telegramButtonRef}
            id="telegram-login-button" 
            style={{ minHeight: '40px', border: '1px dashed #999' }}
          >
            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Контейнер для Telegram кнопки</p>
          </div>
        )}
        {!telegramLoading && !showTelegramButton && <p>Telegram кнопка не загружена</p>}
      </div>
    );
  };

  return (
    <div className="container-auth">
      <div className="auth">
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="sign">Почта</label>
          <input className="auth-input" type="text" name="email" value={formData.email} onChange={handleChange} required />

          <label className="sign">Пароль</label>
          <input className="auth-input" type="password" name="password" value={formData.password} onChange={handleChange} required />

          <div className="button_container">
            {renderTelegramWidget()}
            <button className="but-auth" type="submit" disabled={loading}>
              {loading ? "Входим..." : "Авторизоваться"}
            </button>
          </div>

          <p>Если вы не зарегистрированы, <Link className="a-auth" to='/reg'>зарегистрируйтесь</Link></p>
        </form>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
};

export default Login;
