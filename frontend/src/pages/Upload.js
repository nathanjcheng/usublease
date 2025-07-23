import React, { useState, useRef, useEffect } from 'react';
import { getCurrentUser } from '@aws-amplify/auth';
import { listingsAPI, uploadAPI, searchAPI } from '../services/api';
import { v4 as uuidv4 } from 'uuid';

// Preset data (reuse from App.js if necessary)
const universities = [
  'University of South Florida',
  'University of Florida',
  'Florida State University',
  'University of Central Florida',
  'Florida International University',
  'University of Miami',
  'Florida Atlantic University',
  'Florida A&M University',
  'University of North Florida',
  'Florida Gulf Coast University',
  'University of West Florida',
  'Florida Polytechnic University',
  'New College of Florida',
  'Florida Southern College',
  'Stetson University'
];

const semesters = ['Fall', 'Spring', 'Summer'];

function Upload() {
  const [step, setStep] = useState(0);
  // Total number of steps (index of the final step). Update this if you add/remove steps.
  const totalSteps = 6; // 0-6 inclusive
  const [formData, setFormData] = useState({
    semester: '',
    year: 2025,
    startDate: '',
    endDate: '',
    university: '',
    address: '',
    unitType: '',
    beds: '',
    baths: '',
    bedsOffered: '',
    bathsOffered: '',
    sharedBath: false,
    monthlyRent: '',
    securityDeposit: '',
    utilities: [],
    furnished: false,
    amenities: [],
    rules: {
      pets: false,
      smoking: false,
      roommateGender: 'Any'
    },
    squareFootage: '',
    oneTimeFees: '',
    title: '',
    description: '',
    thumbnailIndex: 0
  });

  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mapbox requests are proxied through the backend to avoid exposing the API key
  const addressTimer = useRef(null);

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxGroup = (group, option) => (e) => {
    setFormData((prev) => {
      const arr = prev[group];
      const exists = arr.includes(option);
      return {
        ...prev,
        [group]: exists ? arr.filter((o) => o !== option) : [...arr, option]
      };
    });
  };

  const handleAddressInput = (e) => {
    const value = e.target.value;
    setFormData((prev)=>({...prev,address:value}));
    if(addressTimer.current) clearTimeout(addressTimer.current);
    if(value.length<3){ setAddressSuggestions([]); return; }
    addressTimer.current = setTimeout(async () => {
      try {
        const data = await searchAPI.getAddressSuggestions(value);
        setAddressSuggestions(data.features || []);
      } catch (err) {
        console.error(err);
      }
    }, 300);
  };

  const selectSuggestion = (feat)=>{
    setFormData(prev=>({...prev,address:feat.place_name, lat:feat.center[1], lon:feat.center[0]}));
    setAddressSuggestions([]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get current user
      const user = await getCurrentUser();
      
      // Prepare listing data
      const listingData = {
        ...formData,
        userId: user.username,
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      
      // Create listing via API
      const result = await listingsAPI.createListing(listingData);
      alert('Listing created successfully!');
      
      // Reset form or redirect
      setFormData({
        semester: '',
        year: 2025,
        startDate: '',
        endDate: '',
        university: '',
        address: '',
        unitType: '',
        beds: '',
        baths: '',
        bedsOffered: '',
        bathsOffered: '',
        sharedBath: false,
        monthlyRent: '',
        securityDeposit: '',
        utilities: [],
        furnished: false,
        amenities: [],
        rules: {
          pets: false,
          smoking: false,
          roommateGender: 'Any'
        },
        squareFootage: '',
        oneTimeFees: '',
        title: '',
        description: '',
        thumbnailIndex: 0
      });
      setStep(0);
    } catch (err) {
      console.error('Error creating listing:', err);
      setError('Failed to create listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render step components
  return (
    <div className="page-container" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h1>Tell us about your Sublease</h1>
      {error && <div className="error-message" style={{color: 'red', marginBottom: '1rem'}}>{error}</div>}
      {/* Progress Bar */}
      <div style={{width:'100%',background:'#e0e0e0',height:'4px',borderRadius:'4px',margin:'10px 0'}}>
        <div
          style={{
            width: `${(step/totalSteps)*100}%`,
            background: '#793094',
            height: '100%',
            borderRadius: '4px',
            transition: 'width 0.3s ease'
          }}
        ></div>
      </div>
      {step === 0 && (
        <div style={{display:'flex',flexDirection:'column',gap:'2rem',alignItems:'flex-start',width:'100%'}}>
          {/* Availability Section */}
          <div style={{background:'#fff',borderRadius:'8px',padding:'1.5rem',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',width:'100%'}}>
            <h3 style={{margin:'0 0 0.5rem 0'}}>Availability</h3>
            <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',columnGap:'10px',rowGap:'10px',marginBottom:'1rem'}}>
              <label style={{marginRight:'5px'}}>Semester:</label>
              {semesters.map((s)=>(
                <button
                  key={s}
                  type="button"
                  className={`button-13 semester ${formData.semester===s ? 'selected' : ''}`}
                  onClick={()=>setFormData(prev=>({...prev, semester:s}))}
                >
                  {s}
                </button>
              ))}
              <span style={{marginLeft:'10px'}}>Year:</span>
              <input type="number" className="input-13" value={formData.year} onChange={handleChange('year')} style={{width:'80px'}} />
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'20px',flexWrap:'wrap'}}>
              <label>Start:</label>
              <input type="date" className="input-13" style={{width:'160px'}} value={formData.startDate} onChange={handleChange('startDate')} />
              <label style={{marginLeft:'20px'}}>End:</label>
              <input type="date" className="input-13" style={{width:'160px'}} value={formData.endDate} onChange={handleChange('endDate')} />
            </div>
            {/* Navigation Buttons */}
            <div style={{display:'flex',justifyContent:'center',marginTop:'1.5rem'}}>
              <button className="button-13 save" onClick={handleNext} disabled={loading}>Next</button>
            </div>
          </div>
        </div>
      )}

      {/* Campus & Address Step */}
      {step === 1 && (
        <div style={{display:'flex',flexDirection:'column',gap:'2rem',alignItems:'flex-start',width:'100%'}}>
          <div style={{background:'#fff',borderRadius:'8px',padding:'1.5rem',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',width:'100%'}}>
            <h3 style={{margin:'0 0 0.5rem 0'}}>Campus & Address</h3>
            <div className="form-group" style={{marginBottom:'1rem',display:'flex',alignItems:'center',gap:'10px'}}>
              <label>University:</label>
              <select className="input-13 select" value={formData.university} onChange={handleChange('university')}>
                <option value="">Select University</option>
                {universities.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{marginBottom:'1rem'}}>
              <label>Address:</label>
              <input
                type="text"
                className="input-13"
                value={formData.address}
                onChange={handleAddressInput}
                placeholder="Enter address..."
              />
              {addressSuggestions.length > 0 && (
                <div style={{position:'absolute',background:'white',border:'1px solid #ccc',borderRadius:'4px',maxHeight:'200px',overflow:'auto',width:'100%',zIndex:1000}}>
                  {addressSuggestions.map((feat, idx) => (
                    <div
                      key={idx}
                      style={{padding:'10px',cursor:'pointer',borderBottom:'1px solid #eee'}}
                      onClick={() => selectSuggestion(feat)}
                    >
                      {feat.place_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Navigation Buttons */}
            <div style={{display:'flex',justifyContent:'space-between',marginTop:'1.5rem'}}>
              <button className="button-13" onClick={handleBack} disabled={loading}>Back</button>
              <button className="button-13 save" onClick={handleNext} disabled={loading}>Next</button>
            </div>
          </div>
        </div>
      )}

      {/* Unit Details Step */}
      {step === 2 && (
        <div style={{display:'flex',flexDirection:'column',gap:'2rem',alignItems:'flex-start',width:'100%'}}>
          <div style={{background:'#fff',borderRadius:'8px',padding:'1.5rem',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',width:'100%'}}>
            <h3 style={{margin:'0 0 0.5rem 0'}}>Unit Details</h3>
            <div style={{marginBottom:'1rem',display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
              <label>Unit Type:</label>
              {['Entire Apt','Private Room','Shared Room'].map((t)=>(
                <button
                  key={t}
                  type="button"
                  className={`button-13 semester unit ${formData.unitType===t ? 'selected': ''}`}
                  onClick={()=>setFormData(prev=>({...prev, unitType:t}))}
                >{t}</button>
              ))}
            </div>

            {/* Beds/Baths Row 1 */}
            <div style={{display:'flex',alignItems:'center',gap:'20px',flexWrap:'wrap',marginBottom:'10px'}}>
              <label>Total Beds:<input type="number" className="input-13" value={formData.beds} onChange={handleChange('beds')} style={{width:'60px',marginLeft:'5px'}} /></label>
              <label>Total Baths:<input type="number" className="input-13" value={formData.baths} onChange={handleChange('baths')} style={{width:'60px',marginLeft:'5px'}} /></label>
            </div>

            {/* Beds/Baths Row 2 */}
            <div style={{display:'flex',alignItems:'center',gap:'20px',flexWrap:'wrap',marginBottom:'10px'}}>
              <label>Beds in Sublease:<input type="number" className="input-13" value={formData.bedsOffered} onChange={handleChange('bedsOffered')} style={{width:'60px',marginLeft:'5px'}} /></label>
              <label>Baths in Sublease:<input type="number" className="input-13" value={formData.bathsOffered} onChange={handleChange('bathsOffered')} style={{width:'60px',marginLeft:'5px'}} /></label>
            </div>
            <div style={{marginTop:'10px'}}>
              <label style={{display:'flex',alignItems:'center',gap:'5px'}}>
                Shared Bath?
                <input type="checkbox" checked={formData.sharedBath} onChange={handleChange('sharedBath')} />
              </label>
            </div>

            {/* Navigation Buttons */}
            <div style={{display:'flex',justifyContent:'center',marginTop:'1.5rem',gap:'10px'}}>
              <button className="button-13" onClick={handleBack}>Back</button>
              <button className="button-13 save" onClick={handleNext}>Next</button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{display:'flex',flexDirection:'column',gap:'2rem',alignItems:'flex-start',width:'100%'}}>
          {/* Price Container */}
          <div style={{background:'#fff',borderRadius:'8px',padding:'1.5rem',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',width:'100%'}}>
            <h3 style={{margin:'0 0 0.5rem 0'}}>Price & Features</h3>
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <label style={{display:'flex',alignItems:'center',gap:'10px'}}>Monthly Rent ($):
                <input type="number" className="input-13" value={formData.monthlyRent} onChange={handleChange('monthlyRent')} style={{width:'120px'}} />
              </label>
              <label style={{display:'flex',alignItems:'center',gap:'10px'}}>Security Deposit ($):
                <input type="number" className="input-13" value={formData.securityDeposit} onChange={handleChange('securityDeposit')} style={{width:'120px'}} />
              </label>
            </div>
          </div>

          {/* Utilities Container */}
          <div style={{background:'#fff',borderRadius:'8px',padding:'1.5rem',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',width:'100%'}}>
            <h3 style={{margin:'0 0 0.5rem 0'}}>Utilities Included in Rent</h3>
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {['Electric','Water','Wi-Fi'].map((u)=>(
                <label key={u} style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  <input type="checkbox" checked={formData.utilities.includes(u)} onChange={handleCheckboxGroup('utilities',u)} />
                  {u}
                </label>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div style={{alignSelf:'center'}}>
            <button className="button-13" onClick={handleBack}>Back</button>{' '}
            <button className="button-13 save" onClick={handleNext}>Next</button>
          </div>
        </div>
      )}

      {/* Description Step */}
      {step === 4 && (
        <div>
          <h2>Description</h2>
          <div className="form-group">
            <label>Title:</label>
            <input type="text" value={formData.title} onChange={handleChange('title')} maxLength={80} />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea value={formData.description} onChange={handleChange('description')} maxLength={300} rows={4} />
          </div>
          <button className="button-13" onClick={handleBack}>Back</button>{' '}
          <button className="button-13 save" onClick={handleNext}>Review</button>
        </div>
      )}

      {/* Review Step */}
      {step === 5 && (
        <div>
          <h2>Review Your Listing</h2>
          <div style={{background:'#fff',padding:'1rem',borderRadius:'8px',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',maxHeight:'400px',overflowY:'auto'}}>
            <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(formData, null, 2)}</pre>
          </div>
          <div style={{marginTop:'1.5rem'}}>
            <button className="button-13" onClick={handleBack}>Back</button>{' '}
            <button className="button-13 save" onClick={handleSubmit}>Submit</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Upload; 