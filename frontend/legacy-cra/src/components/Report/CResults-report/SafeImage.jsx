import React, { useState, useEffect } from 'react';

const SafeImage = ({ src, alt, className, fallbackSrc = '/img/default.svg' }) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) {
      setImageSrc(fallbackSrc);
      return;
    }
    setImageSrc(src);
    setHasError(false);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(true);
    }
  };

  return (
    <img
      src={imageSrc}
      alt={alt || 'Изображение'}
      className={`safe-image ${hasError ? 'safe-image-error' : ''} ${className || ''}`}
      onError={handleError}
    />
  );
};

export default SafeImage; 