# Используем официальный Node.js образ
FROM node:18-alpine as build

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Создаем .env файл с переменными окружения
RUN echo "REACT_APP_API_URL=https://absoluteomsk01.ru" > .env && \
    echo "REACT_APP_API_BASE_URL=https://absoluteomsk01.ru" >> .env

# Собираем приложение
RUN npm run build

# Второй этап - nginx для раздачи статических файлов
FROM nginx:alpine

# Копируем собранные файлы из первого этапа
COPY --from=build /app/build /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Открываем порт 80
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]