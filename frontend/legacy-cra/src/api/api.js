import axios from "axios";
import Cookies from "js-cookie";

const ApiUrl = process.env.REACT_APP_API_URL; 
const API_BASE_URL = `${ApiUrl}/api/`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Добавление `access` токена в заголовки всех запросов
api.interceptors.request.use((config) => {
  const accessToken = Cookies.get("access");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Перехват ошибок 401 (если access истек) и обновление токена
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      const refreshToken = Cookies.get("refresh");
      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(`${ApiUrl}/api/auth/jwt/refresh/`, {
            refresh: refreshToken,
          });

          const newAccessToken = refreshResponse.data.access;
          Cookies.set("access", newAccessToken, { expires: 1, secure: true, sameSite: "Strict" });

          // Повторяем оригинальный запрос с новым `access` токеном
          error.config.headers.Authorization = `Bearer ${newAccessToken}`;
          return axios(error.config);
        } catch (refreshError) {
          console.error("Ошибка обновления токена", refreshError);
          Cookies.remove("access");
          Cookies.remove("refresh");
          // Перенаправляем на главную после выхода
          window.location.href = "/home-page"; // Перенаправление на главную страницу
        }
      }
    }
    return Promise.reject(error);
  }
);

// Авторизация через Telegram
export const loginWithTelegram = async (params) => {
  try {
    const response = await api.get("user/telegram/", { params });
    const { access, refresh } = response.data;

    if (access && refresh) {
      Cookies.set("access", access, { expires: 1, secure: true, sameSite: "Strict" });
      Cookies.set("refresh", refresh, { expires: 7, secure: true, sameSite: "Strict" });

      return true; // Успешная авторизация
    }
  } catch (error) {
    console.error("Ошибка авторизации через Telegram", error);
  }
  return false; // Ошибка авторизации
};

export default api;
