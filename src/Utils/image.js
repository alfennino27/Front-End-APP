import noImageAvailable from '../assets/images/noImageAvailable.png';

export const getImageUrl = (imagePath) => {
  if (typeof imagePath !== 'string' || !imagePath) return noImageAvailable;

  const localImageMode = localStorage.getItem('localImageMode');

  if (imagePath.startsWith('/uploads')) {
    if (localImageMode === 'local') {
      return `http://localhost:3001${imagePath}`;
    } else {
      return `https://api.karyalogamfurniture.com${imagePath}`;
    }
  }

  return imagePath;
};
