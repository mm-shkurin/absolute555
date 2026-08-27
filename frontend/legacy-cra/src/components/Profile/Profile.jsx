import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "./../../api/api.js";
import "./../Profile/Profile.scss";
import Cookies from "js-cookie";
import default_photo from "./../../img/default.svg";
import pensil from "./../../img/pensil.svg";
import { formatPrice } from "../../utils/priceFormatter.js";
import { getImageUrl } from "../../utils/imageUrl.js";

const Profile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogout = () => {
        Cookies.remove("access");
        Cookies.remove("refresh");
        setUser(null);
        // Перенаправляем на главную после выхода
        navigate("/home-page");
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get("user/me/");
                setUser(response.data);
            } catch (err) {
                console.error("Ошибка загрузки профиля:", err);
                setError("Не удалось загрузить профиль.");
                // Перенаправляем на страницу входа если нет авторизации
                if (err.response?.status === 401) {
                    navigate("/login");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    if (loading) {
        return <div className="profile">Загрузка...</div>;
    }

    if (error) {
        return <div className="profile error">{error}</div>;
    }

    if (!user) {
        return (
            <div className="profile">
                <p>Пользователь не авторизован</p>
                <Link to="/login">Войти</Link>
            </div>
        );
    }

    return (
        <div className="profile">
            <div className="profile-header">
                <div className="user-prof">
                    {user.avatar ? (
                        <img src={`${process.env.REACT_APP_API_BASE_URL}${user.avatar}`} alt="Аватар" className="profile-avatar" />
                    ) : (
                        <img className='profile-placeholder' alt="non_avatar" src={default_photo} />
                    )}
                    <h2 className="profile-username">{user.username || "Пользователь"}</h2>
                </div>
                <div className="user-prof">
                    <button className="logout-button" onClick={handleLogout}>Выйти</button>
                </div>
            </div>
            <div className="prfile_description">
                {/* Боковое меню отчетов */}
                <div className="buys_reports">
                    <label>Ваши отчеты:</label>
                    <div className="reports-list">
                        {user.reports?.length > 0 ? (
                            user.reports.map((report) => (
                                <div className="report-item" key={report.id}>
                                    <div className="report-info">
                                        <h4>{report.brand} {report.model}</h4>
                                        <span className="report-date">
                                            {new Date(report.created_at).toLocaleDateString('ru-RU')}
                                        </span>
                                    </div>
                                    <div className="report-stats-mini">
                                        <span>ДТП: {report.accidents_count}</span>
                                        <span>Огр: {report.restrictions_count}</span>
                                        <span>Розыск: {report.wanted_count}</span>
                                    </div>
                                    <Link 
                                        to={`/report/${report.car?.vin || report.vin || report.vehicle_vin}`}
                                        className="download-report-btn"
                                    >
                                        Скачать
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <p className="no-reports">Нет отчетов</p>
                        )}
                    </div>
                </div>

                {/* Секция автомобилей */}
                <div className="profile-cars">
                    <h3>Автомобили:</h3>
                    <div className="container-with-cars">
                        {user.cars?.length > 0 ? (
                            user.cars.map((car) => (
                                <div className="card" key={car.id}>
                                    <Link to={`/car/${car.vin}`} className="car-image">
                                        {car.images?.[0]?.img ? (
                                            <img 
                                                src={getImageUrl(car.images[0].img)} 
                                                alt={car.model_name || "Автомобиль"} 
                                            />
                                        ) : (
                                            <p>Нет изображения</p>
                                        )}
                                    </Link>
                                    <div className="details">
                                        <Link to={`/car/${car.vin}`} className="car-title">
                                            {car.brand_name && car.model_name ? `${car.brand_name} ${car.model_name}` : car.model_name || "Модель не указана"}
                                            <p>{car.modelyear || "Год не указан"}</p>
                                        </Link>

                                        <div className="card-price">
                                            <p>{formatPrice(car.price)}</p>
                                        </div>
                                        <div className="car-details">
                                            <p>
                                                {car.mileage ? `${car.mileage.toLocaleString()} км` : "Пробег не указан"},
                                                {car.drive || "Привод не указан"},
                                                {car.engine_power ? `${car.engine_power} л.с` : "Мощность не указана"},
                                                {car.gear || "КПП не указана"},
                                                {car.fuel_type || "Топливо не указано"}
                                            </p>
                                        </div>
                                        <div className="edit-but">
                                            <Link to={`/cars/${car.vin}/update`} className="e">
                                                <button>
                                                    <img src={pensil} alt="change" className="pensil" />
                                                    Редактировать
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>Нет автомобилей</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;