import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from "./../../../api/api.js";
import './../CAdd-car/Add-car.scss';

const ManualAddCar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { message, vin: preFilledVin } = location.state || {};

    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showModelModal, setShowModelModal] = useState(false);
    const [showBrandModal, setShowBrandModal] = useState(false);
    const [newModelData, setNewModelData] = useState({
        name: '',
        brand: ''
    });
    const [newBrandData, setNewBrandData] = useState({
        name: ''
    });
    const [creatingModel, setCreatingModel] = useState(false);
    const [creatingBrand, setCreatingBrand] = useState(false);

    const [formData, setFormData] = useState({
        vin: preFilledVin || '',
        brand: '',
        model: '',
        brand_name: '',
        model_name: '',
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
        modification: '',
        generation: '',
        body_number: '',
        images: [],
    });

    const [newImages, setNewImages] = useState([]);

    // Загрузка брендов
    useEffect(() => {
        const fetchBrands = async () => {
            try {
                const response = await api.get('card/brands/');
                setBrands(response.data);
            } catch (err) {
                console.error('Ошибка загрузки брендов:', err);
            }
        };
        fetchBrands();
    }, []);

    // Загрузка моделей при выборе бренда
    useEffect(() => {
        if (formData.brand) {
            const selectedBrand = brands.find(b => b.id === Number(formData.brand));
            if (selectedBrand) {
                setModels(selectedBrand.models || []);
                setFormData(prev => ({
                    ...prev,
                    brand_name: selectedBrand.name,
                    model: '',
                    model_name: ''
                }));
            }
        } else {
            setModels([]);
        }
    }, [formData.brand, brands]);

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

    const handleCreateModel = async (e) => {
        e.preventDefault();
        setCreatingModel(true);
        
        // Проверяем, не существует ли уже такая модель
        const existingModel = models.find(m => 
            m.name.toLowerCase() === newModelData.name.toLowerCase()
        );
        
        if (existingModel) {
            alert(`Модель "${newModelData.name}" уже существует для этого бренда. Выберите её из списка.`);
            setFormData(prev => ({
                ...prev,
                model: existingModel.id.toString(),
                model_name: existingModel.name
            }));
            setShowModelModal(false);
            setNewModelData({ name: '', brand: '' });
            setCreatingModel(false);
            return;
        }
        
        console.log('Отправляемые данные для создания модели:', {
            name: newModelData.name,
            brand_id: parseInt(formData.brand)
        });
        
        try {
            const response = await api.post('card/models/create/', {
                name: newModelData.name,
                brand_id: parseInt(formData.brand)
            });
            
            console.log('Модель создана:', response.data);
            console.log('Тип response.data:', typeof response.data);
            console.log('response.data.model:', response.data.model);
            
            // Проверяем, что данные корректные
            if (!response.data || !response.data.model || !response.data.model.id) {
                console.error('Некорректные данные ответа:', response.data);
                alert('Ошибка: сервер вернул некорректные данные');
                return;
            }
            
            const newModel = response.data.model;
            
            // Обновляем список моделей
            const updatedModels = [...models, newModel];
            setModels(updatedModels);
            
            // Выбираем новую модель
            setFormData(prev => ({
                ...prev,
                model: newModel.id.toString(),
                model_name: newModel.name
            }));
            
            setShowModelModal(false);
            setNewModelData({ name: '', brand: '' });
            alert('Модель успешно создана!');
        } catch (err) {
            console.error('Ошибка создания модели:', err);
            console.error('Детали ошибки:', err.response?.data);
            
            if (err.response?.data?.error?.includes('already exists')) {
                alert('Модель с таким названием уже существует для этого бренда. Выберите её из списка или введите другое название.');
            } else {
                alert('Ошибка создания модели: ' + (err.response?.data?.detail || err.response?.data?.message || 'Неизвестная ошибка'));
            }
        } finally {
            setCreatingModel(false);
        }
    };

    const handleCreateBrand = async (e) => {
        e.preventDefault();
        setCreatingBrand(true);
        
        // Проверяем, не существует ли уже такая марка
        const existingBrand = brands.find(b => 
            b.name.toLowerCase() === newBrandData.name.toLowerCase()
        );
        
        if (existingBrand) {
            alert(`Марка "${newBrandData.name}" уже существует. Выберите её из списка.`);
            setFormData(prev => ({
                ...prev,
                brand: existingBrand.id.toString(),
                brand_name: existingBrand.name
            }));
            setShowBrandModal(false);
            setNewBrandData({ name: '' });
            setCreatingBrand(false);
            return;
        }
        
        console.log('Отправляемые данные для создания марки:', {
            name: newBrandData.name
        });
        
        try {
            const response = await api.post('card/brands/create/', {
                name: newBrandData.name
            });
            
            console.log('Марка создана:', response.data);
            
            // Проверяем, что данные корректные
            if (!response.data || !response.data.brand || !response.data.brand.id) {
                console.error('Некорректные данные ответа:', response.data);
                alert('Ошибка: сервер вернул некорректные данные');
                return;
            }
            
            const newBrand = response.data.brand;
            
            // Обновляем список марок
            const updatedBrands = [...brands, newBrand];
            setBrands(updatedBrands);
            
            // Выбираем новую марку
            setFormData(prev => ({
                ...prev,
                brand: newBrand.id.toString(),
                brand_name: newBrand.name,
                model: '',
                model_name: ''
            }));
            
            setShowBrandModal(false);
            setNewBrandData({ name: '' });
            alert('Марка успешно создана!');
        } catch (err) {
            console.error('Ошибка создания марки:', err);
            console.error('Детали ошибки:', err.response?.data);
            
            if (err.response?.data?.error?.includes('already exists')) {
                alert('Марка с таким названием уже существует. Выберите её из списка или введите другое название.');
            } else {
                alert('Ошибка создания марки: ' + (err.response?.data?.detail || err.response?.data?.message || 'Неизвестная ошибка'));
            }
        } finally {
            setCreatingBrand(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const form = new FormData();
        
        // Добавляем только основные поля
        if (formData.vin) form.append('vin', formData.vin);
        if (formData.brand) form.append('brand', formData.brand);
        if (formData.model) form.append('model', formData.model);
        if (formData.bodyname) form.append('bodyname', formData.bodyname);
        if (formData.fuel_type) form.append('fuel_type', formData.fuel_type);
        if (formData.modelyear) form.append('modelyear', formData.modelyear);
        if (formData.engine_power) form.append('engine_power', formData.engine_power);
        if (formData.mileage) form.append('mileage', formData.mileage);
        if (formData.price) form.append('price', formData.price);
        if (formData.gear) form.append('gear', formData.gear);
        if (formData.drive) form.append('drive', formData.drive);
        if (formData.description) form.append('description', formData.description);
        if (formData.color) form.append('color', formData.color);
        if (formData.eco_class) form.append('eco_class', formData.eco_class);
        if (formData.engine_volume) {
            const volume = parseFloat(formData.engine_volume);
            if (!isNaN(volume)) {
                // Попробуем отправить как целое число (умножаем на 10)
                const volumeInt = Math.round(volume * 10);
                form.append('engine_volume', volumeInt.toString());
            }
        }
        if (formData.doors) form.append('doors', formData.doors);
        if (formData.engine_series) form.append('engine_series', formData.engine_series);
        if (formData.modification) form.append('modification', formData.modification);
        if (formData.generation) form.append('generation', formData.generation);
        if (formData.body_number) form.append('body_number', formData.body_number);

        newImages.forEach((image) => {
            form.append('images', image);
        });

        // Логируем данные для отладки
        console.log('Отправляемые данные автомобиля:');
        console.log('formData.brand_name:', formData.brand_name);
        console.log('formData.model_name:', formData.model_name);
        console.log('formData.brand:', formData.brand);
        console.log('formData.model:', formData.model);
        for (let [key, value] of form.entries()) {
            console.log(key, value);
        }

        try {
            const response = await api.post(`card/manual-add-car/`, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            console.log("Ответ от сервера:", response.data);
            alert('Автомобиль успешно добавлен!');
            navigate('/buy-page');
        } catch (err) {
            console.error('Ошибка при добавлении автомобиля:', err.response ? err.response.data : err.message);
            setError(err.response?.data?.detail || "Неизвестная ошибка");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-car">
            <div className="form-add">
                <h2>Добавить автомобиль вручную</h2>
                
                {message && (
                    <div className="info-message">
                        <p>{message}</p>
                    </div>
                )}
                
                <form className="auto-post" onSubmit={handleSubmit}>
                    <input 
                        className="inputinform" 
                        type="text" 
                        name="vin" 
                        placeholder="VIN номер" 
                        value={formData.vin || ""} 
                        onChange={handleInputChange}
                        required
                    />
                    
                    <div className="select-group">
                        <label>Марка:</label>
                        <div className="model-select-container">
                            <select 
                                className="selectinform" 
                                name="brand" 
                                value={formData.brand || ""} 
                                onChange={(e) => {
                                    const selectedBrand = brands.find(b => b.id === Number(e.target.value));
                                    console.log('Выбрана марка:', selectedBrand);
                                    setFormData(prev => ({
                                        ...prev,
                                        brand: e.target.value,
                                        brand_name: selectedBrand ? selectedBrand.name : ''
                                    }));
                                }}
                                required
                            >
                                <option value="">Выберите марку</option>
                                {brands.map((brand) => (
                                    <option key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </option>
                                ))}
                            </select>
                            <button 
                                type="button" 
                                className="add-model-btn"
                                onClick={() => setShowBrandModal(true)}
                            >
                                +
                            </button>
                        </div>
                        
                        {/* Всплывающее окно для создания марки */}
                        {showBrandModal && (
                            <div className="modal-overlay">
                                <div className="modal-content">
                                    <h3>Добавить новую марку</h3>
                                    <div onSubmit={handleCreateBrand}>
                                        <div className="form-group">
                                            <label>Название марки:</label>
                                            <input 
                                                type="text" 
                                                value={newBrandData.name} 
                                                onChange={(e) => setNewBrandData(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="Введите название марки"
                                                required
                                            />
                                        </div>
                                        <div className="modal-buttons">
                                            <button 
                                                type="button" 
                                                disabled={creatingBrand || !newBrandData.name}
                                                className="btn-primary"
                                                onClick={handleCreateBrand}
                                            >
                                                {creatingBrand ? "Создание..." : "Создать марку"}
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    setShowBrandModal(false);
                                                    setNewBrandData({ name: '' });
                                                }}
                                                className="btn-secondary"
                                            >
                                                Отмена
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="select-group">
                        <label>Модель:</label>
                        <div className="model-select-container">
                            <select 
                                className="selectinform" 
                                name="model" 
                                value={formData.model || ""} 
                                onChange={(e) => {
                                    const selectedModel = models.find(m => m.id === Number(e.target.value));
                                    console.log('Выбрана модель:', selectedModel);
                                    setFormData(prev => ({
                                        ...prev,
                                        model: e.target.value,
                                        model_name: selectedModel ? selectedModel.name : ''
                                    }));
                                }}
                                required
                                disabled={!formData.brand}
                            >
                                <option value="">Выберите модель</option>
                                {models.map((model) => (
                                    <option key={model.id} value={model.id}>
                                        {model.name}
                                    </option>
                                ))}
                            </select>
                            {formData.brand && (
                                <button 
                                    type="button" 
                                    className="add-model-btn"
                                    onClick={() => setShowModelModal(true)}
                                >
                                    +
                                </button>
                            )}
                        </div>
                        
                        {/* Всплывающее окно для создания модели */}
                        {showModelModal && (
                            <div className="modal-overlay">
                                <div className="modal-content">
                                    <h3>Добавить новую модель</h3>
                                    <div onSubmit={handleCreateModel}>
                                        <div className="form-group">
                                            <label>Название модели:</label>
                                            <input 
                                                type="text" 
                                                value={newModelData.name} 
                                                onChange={(e) => setNewModelData(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="Введите название модели"
                                                required
                                            />
                                        </div>
                                        <div className="modal-buttons">
                                            <button 
                                                type="button" 
                                                disabled={creatingModel || !newModelData.name}
                                                className="btn-primary"
                                                onClick={handleCreateModel}
                                            >
                                                {creatingModel ? "Создание..." : "Создать модель"}
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    setShowModelModal(false);
                                                    setNewModelData({ name: '', brand: '' });
                                                }}
                                                className="btn-secondary"
                                            >
                                                Отмена
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <input 
                        className="inputinform" 
                        type="text" 
                        name="fuel_type" 
                        placeholder="Топливо" 
                        value={formData.fuel_type || ""} 
                        onChange={handleInputChange} 
                    />
                    <input 
                        className="inputinform" 
                        type="text" 
                        name="gear" 
                        placeholder="Коробка" 
                        value={formData.gear || ""} 
                        onChange={handleInputChange} 
                    />
                    <input 
                        className="inputinform" 
                        type="text" 
                        name="drive" 
                        placeholder="Тип трансмиссии" 
                        value={formData.drive || ""} 
                        onChange={handleInputChange} 
                    />
                    <input 
                        className="inputinform" 
                        type="text" 
                        name="description" 
                        placeholder="Описание" 
                        value={formData.description || ""} 
                        onChange={handleInputChange} 
                    />
                    <input 
                        className="inputinform" 
                        type="number" 
                        name="modelyear" 
                        placeholder="Год выпуска" 
                        value={formData.modelyear || ""} 
                        onChange={handleInputChange} 
                    />
                    <input 
                        className="inputinform" 
                        type="number" 
                        name="engine_power" 
                        placeholder="Мощность двигателя" 
                        value={formData.engine_power || ""} 
                        onChange={handleInputChange} 
                    />
                    <input 
                        className="inputinform" 
                        type="number" 
                        name="engine_volume" 
                        placeholder="Объем двигателя" 
                        value={formData.engine_volume || ""} 
                        onChange={handleInputChange} 
                    />
                    <input 
                        className="inputinform" 
                        type="number" 
                        name="mileage" 
                        placeholder="Пробег" 
                        value={formData.mileage || ""} 
                        onChange={handleInputChange} 
                    />
                    <input 
                        className="inputinform" 
                        type="text" 
                        name="price" 
                        placeholder="Цена" 
                        value={formData.price || ""} 
                        onChange={handleInputChange} 
                    />
                    <input 
                        className="inputinform" 
                        type="text" 
                        name="color" 
                        placeholder="Цвет" 
                        value={formData.color || ""} 
                        onChange={handleInputChange} 
                    />
                    <input 
                        className="inputinform" 
                        type="text" 
                        name="eco_class" 
                        placeholder="Экологический класс" 
                        value={formData.eco_class || ""} 
                        onChange={handleInputChange} 
                    />
                    <input 
                        className="inputinform" 
                        type="text" 
                        name="bodyname" 
                        placeholder="Тип кузова" 
                        value={formData.bodyname || ""} 
                        onChange={handleInputChange} 
                    />
                    <input 
                        className="inputinform" 
                        type="number" 
                        name="doors" 
                        placeholder="Количество дверей" 
                        value={formData.doors || ""} 
                        onChange={handleInputChange} 
                    />
                    <input 
                        className="inputinform" 
                        type="text" 
                        name="engine_series" 
                        placeholder="Серия двигателя" 
                        value={formData.engine_series || ""} 
                        onChange={handleInputChange} 
                    />
                    <input 
                        className="inputinform" 
                        type="text" 
                        name="modification" 
                        placeholder="Модификация" 
                        value={formData.modification || ""} 
                        onChange={handleInputChange} 
                    />
                    <input 
                        className="inputinform" 
                        type="text" 
                        name="generation" 
                        placeholder="Поколение" 
                        value={formData.generation || ""} 
                        onChange={handleInputChange} 
                    />
                    <input 
                        className="inputinform" 
                        type="text" 
                        name="body_number" 
                        placeholder="Номер кузова" 
                        value={formData.body_number || ""} 
                        onChange={handleInputChange} 
                    />
                    
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
                    
                    {error && <p className="error">{error}</p>}
                    
                    <button className="but-inform" type="submit" disabled={loading}>
                        {loading ? "Добавление..." : "Добавить автомобиль"}
                    </button>
                    <button className="but-inform" type="button" onClick={() => navigate('/buy-page')}>
                        Отмена
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ManualAddCar; 