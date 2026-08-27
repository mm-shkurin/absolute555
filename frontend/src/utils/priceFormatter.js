export const formatPrice = (price) => {
    if (!price || price === "0.00" || price === "0") {
        return "Цена не указана";
    }
    
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) {
        return "Цена не указана";
    }
    
    return numPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
}; 