import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './../CCard/Card.scss';
import api from "./../../../api/api.js";
import { formatPrice } from '../../../utils/priceFormatter.js';

const ListCard = () => {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Фильтры
    const [brand] = useState('');
    const [model] = useState('');

    const carouselRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    // Получение данных
    const fetchCars = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("card/cars/", {
                params: { brand_id: brand, model_id: model }
            });
            setCars(response.data);
        } catch (err) {
            setError('Ошибка загрузки автомобилей');
        } finally {
            setLoading(false);
        }
    }, [brand, model]);

    const fetchBrands = useCallback(async () => {
        try {
            await api.get("card/brands/");
        } catch (err) {
            console.error('Ошибка загрузки брендов');
        }
    }, []);

    const handleTouchStart = useCallback((e) => {
        setIsDragging(true);
        setStartX(e.pageX || e.touches[0].pageX);
        setScrollLeft(carouselRef.current.scrollLeft);
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX || e.touches[0].pageX;
        const walk = (x - startX) * 1.5;
        carouselRef.current.scrollLeft = scrollLeft - walk;
    }, [isDragging, scrollLeft, startX]);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        fetchBrands();
        fetchCars();
    }, [fetchBrands, fetchCars]);

    if (loading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="car-list-container">
            <div
                className="list-with-car"
                ref={carouselRef}
                onMouseDown={handleTouchStart}
                onMouseMove={handleTouchMove}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {cars.map((car) => (
                    <div className="list-card" key={car.vin}>
                        <Link to={`/car/${car.vin}`} className="car-image">
                            
                            {car.images?.length > 0 ? (
                                <img src={car.images[0].img.startsWith('http') ? car.images[0].img : `${process.env.REACT_APP_API_URL}${car.images[0].img}`} alt={car.model} loading="lazy" />
                            ) : (
                                <div className="no-image">Нет изображения</div>
                            )}
                        </Link>
                        <div className="details">
                            <Link to={`/car/${car.vin}`} className="car-title">
                                {car.brand_name && car.model_name ? `${car.brand_name} ${car.model_name}` : car.model_name || car.model}
                                <p>{car.modelyear || 'Не указан'}</p>
                            </Link>
                            <div className="card-price">
                                <p>{formatPrice(car.price)}</p>
                            </div>
                            <div className="car-details">
                                <p>{car.mileage} км, {car.drive}, {car.engine_power} л.с, {car.gear}, {car.fuel_type}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ListCard;