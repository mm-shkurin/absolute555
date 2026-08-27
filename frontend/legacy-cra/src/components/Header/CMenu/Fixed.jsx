import React, { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import api from "./../../../api/api.js";
import file from "./../../../img/file.svg";
import search from "./../../../img/search.svg";
import pay from "./../../../img/pay.svg";
import report from "./../../../img/report.svg";
import "./../CMenu/Menu.scss";
import { Link } from "react-router-dom";

function Fixed() {
    const [username, setUsername] = useState(null);

    const dropdownRef = useRef(null);

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

    return (
        <section className="menu">
            <div className="menu-fixed">
                <ul className="nav-links-fix">
                    <Link to="/buy-page">
                        <li>
                            <img src={search} className="CPay" alt="serach"/>
                            <p >Купить</p>
                        </li>
                    </Link>
                    <Link to="/sale-page">
                        <li>
                            <img src={pay} className="CPay" alt="pay"/>
                            <p>Продать</p>
                        </li>
                    </Link>
                    
                    <Link to="/report/create">
                        <li>
                            <img src={report} className="CPay" alt="report"/>
                            <p>Отчет</p>
                        </li>
                    </Link>
                    <li>
                        <div className="c-exit-fixed">
                            <img src={file} alt="Exit" className="Exit" style={{ cursor: "pointer" }} />
                            {username ? (
                                <Link to="/my-profile">
                                    <div className="user-dropdown" ref={dropdownRef}>
                                        <span className="username">
                                            {username}
                                        </span>
                                    </div>
                                </Link>
                            ) : (
                                <Link to="/exit-page">Вход</Link>
                            )}
                        </div>
                    </li>
                </ul>
            </div>
        </section>
    );
}

export default Fixed;
