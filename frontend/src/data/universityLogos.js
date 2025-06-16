// Import university logos
import logo1 from '../assets/universityLogos/1.png';
import logo2 from '../assets/universityLogos/2.png';
import logo3 from '../assets/universityLogos/3.png';
import logo4 from '../assets/universityLogos/4.png';
import logo5 from '../assets/universityLogos/5.png';
import logo6 from '../assets/universityLogos/6.png';
import logo7 from '../assets/universityLogos/7.png';
import logo8 from '../assets/universityLogos/8.png';
import logo9 from '../assets/universityLogos/9.png';

// Array of all available logos
const allLogos = [logo1, logo2, logo3, logo4, logo5, logo6, logo7, logo8, logo9];

// Generate array of 30 universities
const universityLogos = Array.from({ length: 30 }, (_, index) => {
  // Cycle through all available logos
  const image = allLogos[index % allLogos.length];
  
  return {
    name: `University ${index + 1}`,
    image: image,
    description: `University Logo ${index + 1}`
  };
});

export default universityLogos; 