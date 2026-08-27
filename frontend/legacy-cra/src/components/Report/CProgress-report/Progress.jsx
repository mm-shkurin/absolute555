import React, { useState, useEffect } from "react";
import api from "./../../../api/api"; 
import "./../CProgress-report/Progress.scss"

const ReportProgress = ({ reportId, vin, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Запрос выполняется...");

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`check-report/?id=${reportId}`);
        setProgress(response.data.percent);
        setMessage(response.data.message);

        if (response.data.message === "Генерация отчета выполнена.") {
          clearInterval(interval);
          onComplete();
        }
      } catch {
        setMessage("Ошибка при проверке отчета.");
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [reportId, onComplete]);

  return (
    <div className="report-progress">
      <h2>Генерация отчета</h2>
      <p>{message}</p>
      <div className="progress-bar">
        <div className="progress" style={{ width: `${progress}%` }}></div>
      </div>
      <p>{progress}%</p>
    </div>
  );
};

export default ReportProgress;
