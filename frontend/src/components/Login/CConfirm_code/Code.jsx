import { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import './../CConfirm_code/Code.scss';
import api from "./../../../api/api.js";

const ConfirmCode = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [message, setMessage] = useState("");
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // Разрешаем только одну цифру
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Перемещаем фокус на следующий инпут
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = code.join("");

    if (fullCode.length === 6) {
      try {
        const response = await api.post("user/confirm-email/", {
          email, 
          code: fullCode 
        });

        const responseData = await response.json();
        console.log("Ответ сервера:", responseData);

        if (response.ok) {
          setMessage("Email подтверждён! Теперь можно войти.");
          setTimeout(() => {
            navigate("/home-page");
          }, 2000);
        } else {
          setMessage(responseData.detail || "Неверный код.");
        }
      } catch (error) {
        console.error("Ошибка:", error);
        setMessage("Ошибка при подтверждении. Попробуйте снова.");
      }
    } else {
      setMessage("Введите 6-значный код.");
    }
  };

  return (
    <form className="confirm-code" onSubmit={handleSubmit}>
      <h2>Подтверждение Email</h2>
      <p>Введите код, отправленный на {email}</p>
      <div className="code-inputs">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            maxLength="1"
            className="code-input"
          />
        ))}
      </div>
      <button type="submit">Подтвердить</button>
      <p>{message}</p>
    </form>
  );
};

export default ConfirmCode;
