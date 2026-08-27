import React, { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import api from "./../../../api/api.js";
import img_exit from "./../../../img/exit.svg";
import "./../CMenu/Menu.scss";
import { Link, useNavigate } from "react-router-dom";

function Navigation() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [username, setUsername] = useState(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const accessToken = Cookies.get("access");
      if (!accessToken) return;

      try {
        const response = await api.get("user/me/");
        setUsername(response.data.username);
      } catch (error) {
        console.error("Ошибка при получении пользователя:", error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const fetchSearchResults = async () => {
      try {
        const response = await api.get(`car/search-cars/?search=${searchQuery}`);
        setSearchResults(response.data);
      } catch (error) {
        console.error("Ошибка при поиске:", error);
      }
    };

    fetchSearchResults();
  }, [searchQuery]);

 

  const handleLogout = () => {
    Cookies.remove("access");
    Cookies.remove("refresh");
    setUsername(null);
    // Перенаправляем на главную после выхода
    navigate("/home-page");
  };

  return (
    <section className="menu">
      <nav className="nav">
        <div className="c-search" ref={searchRef}>
          <form onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </form>

          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((car) => (
                <Link to={`/car/${car.vin}`} key={car.vin} className="search-result-item">
                  {car.images?.length > 0 ? (
                    <img src={car.images[0].img.startsWith('http') ? car.images[0].img : `${process.env.REACT_APP_API_URL}${car.images[0].img}`} alt={car.model} />
                  ) : (
                    <div className="no-image">Нет изображения</div>
                  )}
                  <div className="search-details">
                    <p className="car-title">{car.model}</p>
                    <p className="car-info">
                      {car.modelyear || "Год не указан"}, {car.engine_power} л.с., {car.gear}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <ul className="nav-links">
          <li><Link to="/buy-page">Купить</Link></li>
          <li><Link to="/sale-page">Продать</Link></li>
          <li><Link to="/report/create">Отчет</Link></li>
        </ul>

        <div className="c-exit">
          <img src={img_exit} alt="Exit" onClick={handleLogout} style={{ cursor: "pointer" }} />
          {username ? (
            <div className="user-dropdown">
              <Link to="/my-profile">
              <span
                className="username"
              >
                {username}
              </span>
              </Link>
            </div>
          ) : (
            <Link to="/exit-page">Вход</Link>
          )}
        </div>
      </nav>
    </section>
  );
}

export default Navigation;
