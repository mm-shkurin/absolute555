import React, { useState, useEffect } from "react";
import api from "../../../api/api.js";
import { getImageUrl } from "../../../utils/imageUrl.js";
import "./Slider.scss";

const Slider = () => {
    const [photos, setPhotos] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        api.get("slider/photos/")
            .then((response) => {
                setPhotos(response.data.photos);
            })
            .catch((error) => {
                console.error("Ошибка загрузки изображений:", error);
            });
    }, []);

    useEffect(() => {
        if (photos.length > 0) {
            const interval = setInterval(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
            }, 3000); // Меняем изображение каждые 3 секунды

            return () => clearInterval(interval);
        }
    }, [photos]);

    if (photos.length === 0) return null;

    return (
        <div className="slider-container">
            <div className="slider" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                {photos.map((photo) => (
                    <div key={photo.id} className="slide">
                      <img src={getImageUrl(photo.image_url)} alt={photo.title} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Slider;
