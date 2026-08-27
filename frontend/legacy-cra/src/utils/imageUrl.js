// Утилита для формирования правильного URL изображения
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // Если путь уже полный URL, возвращаем как есть
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Если путь начинается с /media/, добавляем базовый URL
  if (imagePath.startsWith('/media/')) {
    return `${process.env.REACT_APP_API_URL}${imagePath}`;
  }
  
  // Если путь не начинается с /media/, добавляем /media/ и базовый URL
  return `${process.env.REACT_APP_API_URL}/media/${imagePath}`;
}; 