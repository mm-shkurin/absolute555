import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./../CAdd-car/Add-car.scss";
import api from "./../../../api/api.js"

const AddCar = () => {
    const [vin, setVin] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await api.post("card/add-car/", { vin });
            if (response.status === 201 || response.status === 200) {
                navigate(`/cars/${vin}/update/`);
            }
        } catch (err) {
            console.error("Ошибка при добавлении автомобиля:", err);
            // Перенаправляем на ручное добавление с сообщением
            navigate('/cars/manual-add/', { 
                state: { 
                    message: "Не удалось найти автомобиль по VIN. Пожалуйста, заполните данные вручную.",
                    vin: vin 
                } 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-car">
            <div className="form-add">
            <form onSubmit={handleSubmit}>
                <label>Введите VIN:</label>
                <input 
                    type="text" 
                    value={vin} 
                    onChange={(e) => setVin(e.target.value)} 
                    required 
                    placeholder="XXXXX0000XX000000" 
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Добавление..." : "Добавить"}
                </button>
            </form>
            {error && <p className="error">{error}</p>}
            
            <div className="manual-entry-section">
                <p className="manual-entry-text">
                    Если ваш автомобиль новый и не находится на учете в ГАИ, заполните данные вручную
                </p>
                <Link to="/cars/manual-add/" className="manual-entry-link">
                    Добавить автомобиль вручную
                </Link>
            </div>
            </div>
        </div>
    );
};

export default AddCar;
