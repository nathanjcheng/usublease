// Import university logos
import logo1 from '../assets/universityLogos/1.png';
import logo2 from '../assets/universityLogos/2.png';
import logo3 from '../assets/universityLogos/3.png';

// Generate array of 30 universities
const universityLogos = Array.from({ length: 30 }, (_, index) => {
  // First 3 have actual images, rest are placeholders
  const image = index < 3 ? [logo1, logo2, logo3][index] : null;
  
  return {
    name: `University ${index + 1}`,
    image: image,
    description: `University Logo ${index + 1}`
  };
});

export default universityLogos; 