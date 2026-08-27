
import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from "./../../../api/api";
import SafeImage from "./SafeImage";
import "./../CResults-report/Result.scss";

const ReportResult = ({ vin }) => {
    const [reportData, setReportData] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [expandedInspections, setExpandedInspections] = useState({});

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const response = await api.get(
                    `report/reports/${vin}/`
                );
                setReportData(response.data);
            } catch (err) {
                console.error("Ошибка при загрузке отчета: ", err);
                setError("Ошибка при загрузке отчета.");
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [vin]);

    if (loading) {
        return <div>Загрузка отчета...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!reportData || !reportData.report) {
        return <div>Нет данных для отображения</div>;
    }

    const { report, car } = reportData;

    // Функция для подготовки данных для диаграммы пробега
    const prepareMileageData = (inspections) => {
        if (!inspections || inspections.length === 0) return [];
        
        const data = [];
        
        // Добавляем текущие осмотры
        inspections.forEach((inspection, index) => {
            if (inspection.odometer) {
                data.push({
                    name: `Осмотр ${index + 1}`,
                    date: new Date(inspection.date).toLocaleDateString('ru-RU'),
                    mileage: parseInt(inspection.odometer),
                    type: 'Текущий'
                });
            }
        });
        
        // Добавляем предыдущие осмотры
        inspections.forEach((inspection, inspectionIndex) => {
            if (inspection.previous && inspection.previous.length > 0) {
                inspection.previous.forEach((prev, prevIndex) => {
                    if (prev.odometer) {
                        data.push({
                            name: `Осмотр ${inspectionIndex + 1}.${prevIndex + 1}`,
                            date: new Date(prev.dc_date).toLocaleDateString('ru-RU'),
                            mileage: parseInt(prev.odometer),
                            type: 'Предыдущий'
                        });
                    }
                });
            }
        });
        
        // Сортируем по дате
        return data.sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const mileageData = prepareMileageData(report.inspections);

    const toggleInspectionExpansion = (inspectionIndex) => {
        setExpandedInspections(prev => ({
            ...prev,
            [inspectionIndex]: !prev[inspectionIndex]
        }));
    };

    return (
        <div className="report-result">
            <h2>Отчет для VIN: {vin}</h2>
        
            {/* Информация об автомобиле */}
            <div className="report-section">
                <h3>Информация об автомобиле</h3>
                <div className="car-info">
                    <p><strong>Марка:</strong> {car.brand_name}</p>
                    <p><strong>Модель:</strong> {car.model_name}</p>
                    <p><strong>Год выпуска:</strong> {car.modelyear}</p>
                    <p><strong>Цвет:</strong> {car.color}</p>
                    <p><strong>Двигатель:</strong> {car.engine_power} л.с. ({car.engine_volume} см³)</p>
                    <p><strong>Пробег:</strong> {car.mileage ? `${car.mileage.toLocaleString()} км` : 'Не указан'}</p>
                    <p><strong>Цена:</strong> {car.price && car.price !== "0.00" ? `${parseFloat(car.price).toLocaleString()} ₽` : 'Не указана'}</p>
                </div>
            </div>

            {/* Статистика отчета */}
            <div className="report-section">
                <h3>Статистика отчета</h3>
                <div className="report-stats">
                    <div className="stat-item">
                        <span className="stat-label">ДТП:</span>
                        <span className="stat-value">{report.accidents_count}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Ограничения:</span>
                        <span className="stat-value">{report.restrictions_count}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Розыск:</span>
                        <span className="stat-value">{report.wanted_count}</span>
                    </div>
                </div>
            </div>

            {/* История владения */}
            <div className="report-section">
                <h3>История владения</h3>
                {report.registration_history && report.registration_history.length > 0 ? (
                    <div className="ownership-history">
                        {report.registration_history.map((owner, index) => (
                            <div key={index} className="owner-item">
                                <p><strong>Тип владельца:</strong> {owner.owner_type}</p>
                                <p><strong>Период:</strong> {owner.from_date} - {owner.to_date || 'Настоящее время'}</p>
                                <p><strong>Длительность:</strong> {owner.period}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>Нет данных о владении</p>
                )}
            </div>

            {/* Технические осмотры */}
            <div className="report-section">
                <h3>Технические осмотры</h3>
                {report.inspections && report.inspections.length > 0 ? (
                    <div className="inspections">
                        {/* Диаграмма пробега */}
                        {mileageData.length > 0 && (
                            <div className="mileage-chart">
                                <h4>Динамика пробега</h4>
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={mileageData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis 
                                                dataKey="date" 
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                                fontSize={12}
                                            />
                                            <YAxis 
                                                label={{ value: 'Пробег (км)', angle: -90, position: 'insideLeft' }}
                                                fontSize={12}
                                            />
                                            <Tooltip 
                                                formatter={(value, name) => [
                                                    `${value.toLocaleString()} км`, 
                                                    name === 'mileage' ? 'Пробег' : name
                                                ]}
                                                labelFormatter={(label) => `Дата: ${label}`}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="mileage" 
                                                stroke="#013DFF" 
                                                strokeWidth={3}
                                                dot={{ fill: '#013DFF', strokeWidth: 2, r: 6 }}
                                                activeDot={{ r: 8, stroke: '#013DFF', strokeWidth: 2, fill: '#fff' }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="chart-legend">
                                    <div className="legend-item">
                                        <span className="legend-color" style={{backgroundColor: '#013DFF'}}></span>
                                        <span>Пробег автомобиля</span>
                                    </div>
                                </div>
            </div>
                        )}
                        
                        {/* Детали осмотров */}
                        {report.inspections.map((inspection, index) => (
                            <div key={index} className="inspection-item">
                                <div className="inspection-main">
                                    <p><strong>Номер диагностической карты:</strong> {inspection.dc_number}</p>
                                    <p><strong>Дата:</strong> {new Date(inspection.date).toLocaleDateString()}</p>
                                    <p><strong>Срок действия:</strong> {new Date(inspection.expiration).toLocaleDateString()}</p>
                                    <p><strong>Пробег:</strong> {inspection.odometer} км</p>
                                    <p><strong>Оператор:</strong> {inspection.operator}</p>
                                    
                                    {inspection.previous && inspection.previous.length > 0 && (
                                        <button 
                                            className="toggle-previous-btn"
                                            onClick={() => toggleInspectionExpansion(index)}
                                        >
                                            {expandedInspections[index] ? 'Скрыть' : 'Показать'} предыдущие осмотры ({inspection.previous.length})
                                        </button>
                                    )}
                                </div>
                                
                                {inspection.previous && inspection.previous.length > 0 && expandedInspections[index] && (
                                    <div className="previous-inspections">
                                        <h4>Предыдущие осмотры:</h4>
                                        {inspection.previous.map((prev, prevIndex) => (
                                            <div key={prevIndex} className="prev-inspection">
                                                <p>Номер: {prev.dc_number}</p>
                                                <p>Дата: {new Date(prev.dc_date).toLocaleDateString()}</p>
                                                <p>Срок действия: {new Date(prev.dc_expiration).toLocaleDateString()}</p>
                                                <p>Пробег: {prev.odometer} км</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>Нет данных о технических осмотрах</p>
                )}
            </div>

            {/* ДТП */}
            {report.accident_details && report.accident_details.length > 0 && (
                <div className="report-section">
                    <h3>Детали ДТП</h3>
                    <div className="accidents">
                        {report.accident_details.map((accident, index) => {
                            console.log(`ДТП ${index + 1}:`, {
                                DamagePointsSVG: accident.DamagePointsSVG,
                                DamagePointsIMG: accident.DamagePointsIMG
                            });
                            return (
                                <div key={index} className="accident-item">
                                    <h4>ДТП №{accident.num}</h4>
                                    <p><strong>Дата и время:</strong> {accident.AccidentDateTime}</p>
                                    <p><strong>Номер ДТП:</strong> {accident.AccidentNumber}</p>
                                    <p><strong>Тип ДТП:</strong> {accident.AccidentType}</p>
                                    <p><strong>Состояние:</strong> {accident.VehicleDamageState}</p>
                                    <p><strong>Место:</strong> {accident.AccidentPlace}</p>
                                    <p><strong>Регион:</strong> {accident.RegionName}</p>
                                    <p><strong>Марка:</strong> {accident.VehicleMark} {accident.VehicleModel}</p>
                                    <p><strong>Год выпуска:</strong> {accident.VehicleYear}</p>
                                    <p><strong>Тип владельца:</strong> {accident.OwnerOkopf}</p>
                                    
                                                                    {accident.DamagePointsSVG && accident.DamagePointsSVG !== "null" && accident.DamagePointsSVG !== "" && (
                                    <div className="damage-scheme">
                                        <h5>Схема повреждений:</h5>
                                        <SafeImage 
                                            src={accident.DamagePointsSVG} 
                                            alt="Схема повреждений" 
                                            className="damage-img"
                                            fallbackText="Схема повреждений недоступна"
                                        />
                                    </div>
                                )}
                                
                                {accident.DamagePointsIMG && accident.DamagePointsIMG !== "null" && accident.DamagePointsIMG !== "" && (
                                    <div className="damage-photo">
                                        <h5>Фото повреждений:</h5>
                                        <SafeImage 
                                            src={accident.DamagePointsIMG} 
                                            alt="Фото повреждений" 
                                            className="damage-img"
                                            fallbackText="Фото повреждений недоступно"
                                        />
                                    </div>
                                )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Ограничения */}
            {report.restriction_details && report.restriction_details.length > 0 && (
                <div className="report-section">
                    <h3>Ограничения</h3>
                    <div className="restrictions">
                        {report.restriction_details.map((restriction, index) => (
                            <div key={index} className="restriction-item">
                                <p><strong>Тип ограничения:</strong> {restriction.type}</p>
                                <p><strong>Описание:</strong> {restriction.description}</p>
                                <p><strong>Дата:</strong> {restriction.date}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Розыск */}
            {report.wanted_details && report.wanted_details.length > 0 && (
                <div className="report-section">
                    <h3>Розыск</h3>
                    <div className="wanted">
                        {report.wanted_details.map((wanted, index) => (
                            <div key={index} className="wanted-item">
                                <p><strong>Тип розыска:</strong> {wanted.type}</p>
                                <p><strong>Описание:</strong> {wanted.description}</p>
                                <p><strong>Дата:</strong> {wanted.date}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Информация об отчете */}
            <div className="report-section">
                <h3>Информация об отчете</h3>
                <p><strong>Дата создания:</strong> {new Date(report.created_at).toLocaleString()}</p>
                <p><strong>Последнее обновление:</strong> {new Date(report.updated_at).toLocaleString()}</p>
                <p><strong>Модель автомобиля:</strong> {report.vehicle_model}</p>
            </div>
        </div>
    );
};

export default ReportResult;