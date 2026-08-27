
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from "./../../../api/api.js";
import Login from "./../../Login/CAuth/Auth.jsx";
import './../CEdit-car/Edit-car.scss';

const EditCar = () => {
    const { vin } = useParams();
    const navigate = useNavigate();

    console.log(`${vin}`);

    const [formData, setFormData] = useState({
        bodyname: '',
        fuel_type: '',
        modelyear: '',
        engine_power: '',
        mileage: '',
        price: '',
        gear: '',
        drive: '',
        description: '',
        color: '',
        eco_class: '',
        engine_volume: '',
        doors: '',
        engine_series: '',
        images: [],
    });

    const [newImages, setNewImages] = useState([]);
    const [isAuthorized, setIsAuthorized] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!vin) {
            console.error("VIN отсутствует! Проверьте передачу маршрута.");
            setLoading(false);
            return;
        }

        console.log(`${vin}`);

        const fetchCarData = async () => {
            try {
                const response = await api.get(`card/cars/${vin}/update/`);
                console.log("Данные авто:", response.data);

                setFormData((prev) => ({
                    ...prev,
                    ...response.data,
                }));
            } catch (error) {
                console.error('Ошибка загрузки данных авто:', error);
                if (error.response?.status === 401) {
                    setIsAuthorized(false);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCarData();
    }, [vin]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value ?? "",
        }));
    };

    const handleFileChange = (e) => {
        setNewImages(Array.from(e.target.files));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!vin) {
            alert("Ошибка: VIN отсутствует!");
            return;
        }

        console.log(`${vin}`);

        const form = new FormData();
        Object.keys(formData).forEach((key) => {
            if (key !== 'images' && key !== 'vin' && key !== 'body_number' && key !== 'modification' && key !== 'generation') {
                form.append(key, formData[key] || "");
            }
        });

        newImages.forEach((image) => {
            form.append('images', image);
        });

        try {
            const response = await api.put(`card/cars/${vin}/update/`, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            console.log("Ответ от сервера:", response.data);
            alert('Автомобиль успешно обновлён!');
            navigate('/');
        } catch (err) {
            console.error('Ошибка при обновлении автомобиля:', err.response ? err.response.data : err.message);
            alert('Ошибка при обновлении автомобиля:' `${err.response?.data?.detail || "Неизвестная ошибка"}`);
        }
    };

    if (loading) {
        return <p>Загрузка...</p>;
    }

    if (!isAuthorized) {
        return <Login />;
    }

    return (
        <div className="edit-car">
            <div className="modal-content">
                <h2>Редактировать автомобиль</h2>
                <form className="auto-post" onSubmit={handleSubmit}>
                    <input className="inputinform" type="text" name="fuel_type" placeholder="Топливо" value={formData.fuel_type || ""} onChange={handleInputChange} />
                    <input className="inputinform" type="text" name="gear" placeholder="Коробка" value={formData.gear || ""} onChange={handleInputChange} />
                    <input className="inputinform" type="text" name="drive" placeholder="Тип трансмиссии" value={formData.drive || ""} onChange={handleInputChange} />
                    <input className="inputinform" type="text" name="description" placeholder="Описание" value={formData.description || ""} onChange={handleInputChange} />
                    <input className="inputinform" type="number" name="modelyear" placeholder="Год выпуска" value={formData.modelyear || ""} onChange={handleInputChange} />
                    <input className="inputinform" type="number" name="engine_power" placeholder="Мощность двигателя" value={formData.engine_power || ""} onChange={handleInputChange} />
                    <input className="inputinform" type="number" name="engine_volume" placeholder="Объем двигателя" value={formData.engine_volume || ""} onChange={handleInputChange} />
                    <input className="inputinform" type="number" name="mileage" placeholder="Пробег" value={formData.mileage || ""} onChange={handleInputChange} />
                    <input className="inputinform" type="text" name="price" placeholder="Цена" value={formData.price || ""} onChange={handleInputChange} />
                    <input className="inputinform" type="text" name="color" placeholder="Цвет" value={formData.color || ""} onChange={handleInputChange} />
                    <input className="inputinform" type="text" name="eco_class" placeholder="Экологический класс" value={formData.eco_class || ""} onChange={handleInputChange} />
                    <input className="inputinform" type="text" name="bodyname" placeholder="Тип кузова" value={formData.bodyname || ""} onChange={handleInputChange} />
                    <input className="inputinform" type="number" name="doors" placeholder="Количество дверей" value={formData.doors || ""} onChange={handleInputChange} />
                    <input className="inputinform" type="text" name="engine_series" placeholder="Серия двигателя" value={formData.engine_series || ""} onChange={handleInputChange} />
                    
                    <p>Текущие изображения:</p>
                    <div className='current-photo'>
                        {formData.images && formData.images.length > 0 && (
                            formData.images.map((img) => (
                                <img className='current' key={img.id} src={img.img.startsWith('http') ? img.img : `${process.env.REACT_APP_API_URL}${img.img}`} alt="car" width="100" />
                            ))
                        )}
                    </div>
                    
                    <div className="new-photo">
                        <label className="custom-file-upload">
                            <input type="file" name="images" accept="image/*" multiple onChange={handleFileChange} />
                            +
                        </label>

                        {newImages.length > 0 && (
                            <div className="select-im">
                                {newImages.map((image, index) => (
                                    <img key={index} src={URL.createObjectURL(image)} alt={`${index + 1}`} />
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <button className="but-inform" type="submit">Сохранить</button>
                    <button className="but-inform" type="button" onClick={() => navigate('/buy-page')}>Отмена</button>
                </form>
            </div>
        </div>
    );
};

export default EditCar;