import React from 'react';
import './Phone.scss';

const PhoneButton = ({ phoneNumber }) => {
    const handleButtonClick = () => {
        // Здесь можно добавить дополнительную логику, если необходимо
    };

    return (
        <a href={`tel:${phoneNumber}`} className="phone-button" onClick={handleButtonClick}>
            Позвонить {phoneNumber}
        </a>
    );
};

export default PhoneButton;