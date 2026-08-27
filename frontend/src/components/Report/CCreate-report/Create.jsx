import React, { useState } from "react";
import api from "./../../../api/api";
import "./../CCreate-report/Create.scss";

const RequestReport = ({ onReportCreated, onReportReady }) => {
    const [vin, setVin] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!vin) {
            setError("Введите VIN номер!");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            console.log(`Отправляем запрос на: report/generate/${vin}/`);
            const response = await api.post(`report/generate/${vin}/`, {});
            console.log("Ответ от сервера:", response.data);

            if (response.data.id) {
                onReportReady(response.data.id, vin);
            } else {
                console.log("Неизвестная структура ответа:", response.data);
                setError("Ошибка при создании отчёта");
            }
        } catch (err) {
            console.error("Ошибка запроса:", err);
            setError(`Ошибка при создании отчёта: ${err.response?.status || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="report-car">
            <div className="form-report">
                <form onSubmit={handleSubmit}>
                
                <label>Введите VIN:</label>
                    <input
                        type="text"
                        placeholder="Введите VIN"
                        value={vin}
                        onChange={(e) => setVin(e.target.value)}
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? "Создание отчёта..." : "Получить отчёт"}
                    </button>
                </form>
                {error && <p style={{ color: "red" }}>{error}</p>}
            </div>
        </div>
    );
};

export default RequestReport;
