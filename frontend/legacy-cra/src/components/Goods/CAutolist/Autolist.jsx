import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './../CAutolist/Autolist.scss';
import api from "./../../../api/api.js"
import settings from "./../../../img/Settings.svg"
import { formatPrice } from '../../../utils/priceFormatter.js';

const AutoList = () => {
    const [cars, setCars] = useState([]);
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const [formBrand, setFormBrand] = useState('');
    const [formModel, setFormModel] = useState('');
    const [formCategory, setFormCategory] = useState('');
    const [formMinPrice, setFormMinPrice] = useState('');
    const [formMaxPrice, setFormMaxPrice] = useState('');
    const [formSortBy, setFormSortBy] = useState('price');
    const [formOrder, setFormOrder] = useState('asc');

    const [activeBrand, setActiveBrand] = useState('');
    const [activeModel, setActiveModel] = useState('');
    const [activeCategory, setActiveCategory] = useState('');
    const [activeMinPrice, setActiveMinPrice] = useState('');
    const [activeMaxPrice, setActiveMaxPrice] = useState('');
    const [activeSortBy, setActiveSortBy] = useState('price');
    const [activeOrder, setActiveOrder] = useState('asc');

    const [carCount, setCarCount] = useState(0);

    const predefinedCategories = [
        { id: '', name: 'Все' },
        { id: '2', name: 'Дисконт' },
        { id: '1', name: 'Новые' },
        { id: '3', name: 'Архив' }
    ];

    const fetchCars = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            let apiEndpoint = "card/cars/";
            
            if (activeCategory === '3') {
                apiEndpoint = "card/archived-cars/";
            }

            const response = await api.get(apiEndpoint, {
                params: {
                    brand_id: activeBrand || undefined,
                    model_id: activeModel || undefined,
                    category_id: activeCategory === '3' ? undefined : activeCategory || undefined,
                    min_price: activeMinPrice || undefined,
                    max_price: activeMaxPrice || undefined,
                    sort_by: activeSortBy,
                    order: activeOrder
                }
            });
            setCars(response.data);
        } catch (err) {
            setError('Ошибка загрузки автомобилей');
        } finally {
            setLoading(false);
        }
    }, [activeBrand, activeModel, activeCategory, activeMinPrice, activeMaxPrice, activeSortBy, activeOrder]);

    const fetchCarCount = useCallback(async () => {
        try {
            let apiEndpoint = "card/car_count/";
            
            if (activeCategory === '3') {
                apiEndpoint = "card/archived-cars/";
            }

            const response = await api.get(apiEndpoint, {
                params: {
                    brand_id: activeBrand || undefined,
                    model_id: activeModel || undefined,
                    category_id: activeCategory === '3' ? undefined : activeCategory || undefined,
                    min_price: activeMinPrice || undefined,
                    max_price: activeMaxPrice || undefined,
                }
            });
            
            if (activeCategory === '3') {
                setCarCount(response.data.length || 0);
            } else {
            setCarCount(response.data.count);
            }
        } catch (err) {
            console.error('Ошибка получения количества автомобилей');
        }
    }, [activeBrand, activeModel, activeCategory, activeMinPrice, activeMaxPrice]);

    const fetchBrands = useCallback(async () => {
        try {
            const response = await api.get("card/brands/");
            setBrands(response.data);
        } catch (err) {
            console.error('Ошибка загрузки брендов');
        }
    }, []);



    useEffect(() => {
        if (formBrand) {
            const selectedBrand = brands.find(b => b.id === Number(formBrand));
            setModels(selectedBrand ? selectedBrand.models : []);
        } else {
            setModels([]);
            setFormModel('');
        }
    }, [formBrand, brands]);

    useEffect(() => {
        fetchBrands();
        fetchCars();
        fetchCarCount();
    }, [fetchBrands, fetchCars, fetchCarCount]);

    const handleCategoryChange = (categoryId) => {
        setFormCategory(categoryId);
        setActiveCategory(categoryId);
        setShowMobileFilters(false);
    };

    const handleApplyFilters = () => {
        setActiveBrand(formBrand);
        setActiveModel(formModel);
        setActiveCategory(formCategory);
        setActiveMinPrice(formMinPrice);
        setActiveMaxPrice(formMaxPrice);
        setActiveSortBy(formSortBy);
        setActiveOrder(formOrder);
        setShowMobileFilters(false);
    };

    const handleResetFilters = () => {
        setFormBrand('');
        setFormModel('');
        setFormCategory('');
        setFormMinPrice('');
        setFormMaxPrice('');
        setFormSortBy('price');
        setFormOrder('asc');
        
        setActiveBrand('');
        setActiveModel('');
        setActiveCategory('');
        setActiveMinPrice('');
        setActiveMaxPrice('');
        setActiveSortBy('price');
        setActiveOrder('asc');
        
        setShowMobileFilters(false);
    };

    if (loading) return <p>Загрузка...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="cpay">
            <button 
                className="mobile-filter-button" 
                onClick={() => setShowMobileFilters(!showMobileFilters)}
            >
                {showMobileFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
                <img className='settings-image' src={settings} alt="settings"/>
            </button>

            <div className={`filters ${showMobileFilters ? 'mobile-visible' : ''}`}>
                <div className="model-brand">
                    <label>Марка:</label>
                    <select 
                        className="filters-brand" 
                        value={formBrand} 
                        onChange={(e) => setFormBrand(e.target.value)}
                    >
                        <option value="">Все</option>
                        {brands.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>

                    <label>Модель:</label>
                    <select 
                        className="filters-brand" 
                        value={formModel} 
                        onChange={(e) => setFormModel(e.target.value)} 
                        disabled={!formBrand}
                    >
                        <option value="">Все</option>
                        {models.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>

                <div className="model-brand">
                    <label>Цена:</label>
                    <div className="buy-cars">
                        <input
                            type="number"
                            value={formMinPrice}
                            onChange={(e) => setFormMinPrice(e.target.value)}
                            placeholder="От"
                        />
                        <input
                            type="number"
                            value={formMaxPrice}
                            onChange={(e) => setFormMaxPrice(e.target.value)}
                            placeholder="До"
                        />
                    </div>
                </div>

                <div className="but-container">
                    <button className='show-button' onClick={handleApplyFilters}>
                        Показать авто
                    </button>
                    <button className="set-button" onClick={handleResetFilters}>
                        Сбросить
                    </button>
                </div>
            </div>

            <div className="filter-container">
                <div className="category-switcher">
                    <div className="category-buttons">
                        {predefinedCategories.map((category) => (
                            <button
                                key={category.id}
                                className={`category-button ${activeCategory === category.id ? 'active' : ''}`}
                                onClick={() => handleCategoryChange(category.id)}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="filter-cars">
                    <p>Количество автомобилей: {carCount}</p>
                    <select 
                        className="filters-brand" 
                        value={formOrder} 
                        onChange={(e) => setFormOrder(e.target.value)}
                    >
                        <option value="asc">По возрастанию</option>
                        <option value="desc">По убыванию</option>
                    </select>
                </div>
                <div className="container-with-cars">
                    {cars.map((car) => (
                        <div className={`card ${activeCategory === '3' ? 'archived' : ''}`} key={car.vin}>
                            <Link to={`/car/${car.vin}`} className="car-image">
                                {car.car_rating && (
                                    <div
                                        className="rating-badge"
                                        style={{
                                            backgroundColor: car.car_rating.background_color,
                                            color: car.car_rating.color,
                                        }}
                                    >
                                        {car.car_rating.value}
                                    </div>
                                )}
                                {car.images?.length > 0 ? (
                                    <img 
                                        src={car.images[0].img.startsWith('http') ? car.images[0].img : `${process.env.REACT_APP_API_URL}${car.images[0].img}`} 
                                        alt={car.model_name || 'Автомобиль'} 
                                    />
                                ) : (
                                    <p>Нет изображения</p>
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
                                    <p>
                                        {car.mileage ? `${car.mileage.toLocaleString()} км` : 'Пробег не указан'}, 
                                        {car.drive ? ` ${car.drive}` : ''}, 
                                        {car.engine_power ? ` ${car.engine_power} л.с` : ''}, 
                                        {car.gear ? ` ${car.gear}` : ''}, 
                                        {car.fuel_type ? ` ${car.fuel_type}` : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AutoList;