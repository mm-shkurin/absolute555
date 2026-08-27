import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "./../../../api/api.js";
import "./../CAuto-main/Last.scss";
import { formatPrice } from '../../../utils/priceFormatter.js';

const AutoLast = () => {
    const [cars, setCars] = useState([]);

    useEffect(() => {
        const fetchCars = async () => {
            try {
                const response = await api.get("card/last/");
                setCars(response.data);
            } catch (err) {
                console.error("Ошибка загрузки автомобилей");
            }
        };

        fetchCars();
    }, []);

    return (
        <div className="last-with-cars">
            {cars.map((car) => (
                <div className="card-last" key={car.vin}>
                    <Link to={`/car/${car.vin}`} className="car-image-last">
                        {car.images?.length > 0 ? (
                            <img src={car.images[0].img.startsWith('http') ? car.images[0].img : `${process.env.REACT_APP_API_URL}${car.images[0].img}`} alt={car.model} />
                        ) : (
                            <p>Нет изображения</p>
                        )}
                    </Link>
                    <div className="details-last">
                        <Link to={`/car/${car.vin}`} className="car-title">
                            {car.brand_name && car.model_name ? `${car.brand_name} ${car.model_name}` : car.model_name || car.model}
                            <p>{car.modelyear || "Не указан"}</p>
                        </Link>
                        <div className="card-price-last">
                            <p>{formatPrice(car.price)}</p>
                        </div>
                        <div className="car-details-last">
                            <p>
                                {car.mileage} км, {car.drive}, {car.engine_power} л.с, {car.gear}, {car.fuel_type}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AutoLast;