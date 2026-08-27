import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from './../../../api/api.js';
import './../CCard/Card.scss';
import tg_button from './../../../img/tg_icon.svg'
import PhoneButton from './Phone.jsx';
import ListCard from './List_card.jsx';
import { formatPrice } from '../../../utils/priceFormatter.js';
import { getImageUrl } from '../../../utils/imageUrl.js';
const phoneNumber = '+79136515073'; // Замените на нужный номер
const CarDetails = () => {
    const { vin } = useParams();
    const [car, setCar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const fetchCar = async () => {
            try {
                const response = await api.get(`card/cars/${vin}/`);
                setCar(response.data);
            } catch (err) {
                setError("Ошибка загрузки автомобиля");
            } finally {
                setLoading(false);
            }
        };

        fetchCar();
    }, [vin]);

    const handleNextImage = () => {
        if (car?.images?.length > 0) {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % car.images.length);
        }
    };

    const handlePrevImage = () => {
        if (car?.images?.length > 0) {
            setCurrentImageIndex((prevIndex) => (prevIndex - 1 + car.images.length) % car.images.length);
        }
    };

    const handleThumbnailClick = (index) => {
        setCurrentImageIndex(index);
    };

    if (loading) return <p>Загрузка...</p>;
    if (error) return <p>{error}</p>;
    if (!car) return <p>Автомобиль не найден</p>;

    const carImages = car.images?.map((image) => getImageUrl(image.img)) || [];

    return (
        <div className="cars-mb">
            <div className="header-card">
                <h2 className='h2-cards'>{car.brand_name && car.model_name ? `${car.brand_name} ${car.model_name}` : car.model_name || car.model} {car.modelyear} года</h2>
                <p className='price'>{formatPrice(car.price)}</p>
            </div>
            <div className="car-card">
                <div className="car-direction">
                    <div className="slideshow-container">
                        {carImages.length > 0 && (
                            <>
                                <img className="card-img" src={carImages[currentImageIndex]} alt={`Фото ${currentImageIndex + 1}`} />
                                <div className="buttons">
                                    <button onClick={handlePrevImage}></button>
                                    <button onClick={handleNextImage}></button>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="thumbnail-container">
                        {carImages.map((image, index) => (
                            <img
                                key={index}
                                className={`thumbnail ${currentImageIndex === index ? 'active' : ''}`}
                                src={image}
                                alt={`Миниатюра ${index + 1}`}
                                onClick={() => handleThumbnailClick(index)}
                            />
                        ))}
                    </div>
                </div>
                <div className="content_plus_button">
                    <div className="card-content">
                        <p><strong>Год:</strong> {car.modelyear || "Не указан"} г.</p>
                        <p><strong>Кузов:</strong> {car.body || "Не указан"}</p>
                        <p><strong>Коробка:</strong> {car.gear || "Не указана"}</p>
                        <p><strong>Привод:</strong> {car.drive || "Не указан"}</p>
                        <p><strong>Топливо:</strong> {car.fuel_type || "Не указано"}</p>
                        <p><strong>Двигатель:</strong> {car.engine_series || "Не указан"}, {car.engine_power ? `${car.engine_power} л.с.` : "Не указано"}</p>
                        <p><strong>Пробег:</strong> {car.mileage ? `${car.mileage.toLocaleString()} км` : "Не указан"}</p>
                        {car.description && (
                            <div className="car-description">
                                <p><strong>Описание:</strong></p>
                                <p className="description-text">{car.description}</p>
                            </div>
                        )}
                    </div>
                    <div className="button-conteiner">
                        <a className='a-tg-but' href = "https://web.telegram.org/k/#@mmshkurin">
                        <button className="tg-but">
                            <img src={tg_button} alt="tg-but"/>
                            Связаться
                        </button>
                        </a>
                        <PhoneButton phoneNumber={phoneNumber} />
                    </div>
                </div>
            </div>
            <ListCard></ListCard>
        </div>
    );
};

export default CarDetails;