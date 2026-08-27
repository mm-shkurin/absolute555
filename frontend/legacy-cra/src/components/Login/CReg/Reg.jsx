import './../CAuth/Auth.scss';
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPortal } from "react-dom";
import api from './../../../api/api.js';
import { loginWithTelegram } from './../../../api/api.js';

const Register = () => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        password_confirm: "",
    });

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const telegramContainerRef = useRef(null);
    const scriptRef = useRef(null);
    const isMountedRef = useRef(true);
    const portalContainerRef = useRef(null);

    // Создаем портал для Telegram Widget
    useEffect(() => {
        // Создаем отдельный контейнер для Telegram Widget
        const container = document.createElement('div');
        container.id = 'telegram-widget-portal-register';
        container.style.position = 'relative';
        container.style.zIndex = '1000';
        document.body.appendChild(container);
        portalContainerRef.current = container;

        return () => {
            // Очищаем портал при размонтировании
            if (portalContainerRef.current && portalContainerRef.current.parentNode) {
                try {
                    portalContainerRef.current.parentNode.removeChild(portalContainerRef.current);
                } catch (error) {
                    console.warn("Ошибка при удалении портала:", error);
                }
            }
        };
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        console.log("Инициализация Telegram виджета...");
        
        // Создаем глобальную функцию для обработки авторизации
        window.onTelegramAuth = async (user) => {
            if (!isMountedRef.current) return;
            
            console.log("Получены данные от Telegram:", user);
            const success = await loginWithTelegram(user);
            if (success && isMountedRef.current) {
                // Перенаправляем в профиль после Telegram авторизации
                navigate("/my-profile");
            }
        };

        const loadTelegramWidget = () => {
            if (!isMountedRef.current || !portalContainerRef.current) return;
            
            const container = portalContainerRef.current;

            // Очищаем контейнер
            try {
                container.innerHTML = "";
            } catch (error) {
                console.warn("Ошибка при очистке контейнера:", error);
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
                console.log("Telegram виджет загружен успешно");
            };

            script.onerror = (error) => {
                console.error("Ошибка загрузки Telegram Widget:", error);
                if (isMountedRef.current && container) {
                    try {
                        container.innerHTML = '<p style="color: red;">Ошибка загрузки Telegram виджета</p>';
                    } catch (innerError) {
                        console.warn("Ошибка при установке сообщения об ошибке:", innerError);
                    }
                }
            };

            // Сохраняем ссылку на скрипт
            scriptRef.current = script;
            
            try {
                container.appendChild(script);
            } catch (error) {
                console.warn("Ошибка при добавлении скрипта:", error);
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

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("user/register/", formData);
            setMessage("Регистрация прошла успешно. Введите код подтверждения.");
            navigate("/confirm-code", { state: { email: formData.email } });
        } catch (error) {
            setMessage("Ошибка регистрации. Проверьте введённые данные.");
        } finally {
            setLoading(false);
        }
    };

    // Рендерим Telegram Widget через портал
    const renderTelegramWidget = () => {
        if (!portalContainerRef.current) return null;
        
        return createPortal(
            <div ref={telegramContainerRef} id="telegram-login-container">
                <p>Загрузка Telegram виджета...</p>
            </div>,
            portalContainerRef.current
        );
    };

    return (
        <div className="container-auth">
            <div className="auth">
                <form className="auth-form" onSubmit={handleSubmit}>
                    <label className="sign">Имя</label>
                    <input
                        className="auth-input"
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                    <label className="sign">Почта</label>
                    <input
                        className="auth-input"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <label className="sign">Пароль</label>
                    <input
                        className="auth-input"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <label className="sign">Повторите пароль</label>
                    <input
                        className="auth-input"
                        type="password"
                        name="password_confirm"
                        value={formData.password_confirm}
                        onChange={handleChange}
                        required
                    />
                    <div className="button_container">
                        {renderTelegramWidget()}
                        <button 
                            type="button" 
                            className="but-auth" 
                            style={{ backgroundColor: '#0088cc', color: 'white' }}
                            onClick={() => window.open('https://t.me/absolutereg_bot', '_blank')}
                        >
                            Открыть бота в Telegram
                        </button>
                        <button className="but-auth" type="submit" disabled={loading}>
                            {loading ? "Регистрируем..." : "Зарегистрироваться"}
                        </button>
                    </div>
                    <p>Если вы уже зарегистрированы, <Link className="a-auth" to='/exit-page'>войдите</Link></p>
                </form>
                <p>{message}</p>
            </div>
        </div>
    );
};

export default Register;