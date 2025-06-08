import React, { useState, useRef, useEffect } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
  const [formData, setFormData] = useState({
    semester: '',
    year: new Date().getFullYear(),
    startDate: '',
    endDate: '',
    university: '',
    address: '',
    unitType: '',
    beds: 1,
    baths: 1,
    bedsOffered: 1,
    bathsOffered: 1,
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
    photos: [],
    title: '',
    description: '',
    thumbnailIndex: 0
  });

  const [addressSuggestions, setAddressSuggestions] = useState([]);

  // Debounce timer
  const addressTimer = useRef(null);

  const storage = getStorage();
  const fileInputRef = useRef(null);

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

  const handlePhotoUpload = async (files) => {
    const uploads = Array.from(files).slice(0, 15); // cap 15
    const urls = [];
    for (const file of uploads) {
      const fileRef = ref(storage, `listing_images/${uuidv4()}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      urls.push(url);
    }
    setFormData((prev) => ({ ...prev, photos: [...prev.photos, ...urls] }));
  };

  const handleAddressInput = (e) => {
    const value = e.target.value;
    setFormData((prev)=>({...prev,address:value}));
    if(addressTimer.current) clearTimeout(addressTimer.current);
    if(value.length<3){ setAddressSuggestions([]); return; }
    const token = process.env.REACT_APP_MAPBOX_API_KEY || process.env.MAPBOX_API_KEY;
    addressTimer.current = setTimeout(async()=>{
      try{
        // Florida center coordinates for bias (-81.5158 lon, 27.6648 lat)
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${token}&autocomplete=true&limit=5&country=us&proximity=-81.5158,27.6648`);
        const data = await res.json();
        setAddressSuggestions(data.features||[]);
      }catch(err){ console.error(err);}  
    },300);
  };

  const selectSuggestion = (feat)=>{
    setFormData(prev=>({...prev,address:feat.place_name, lat:feat.center[1], lon:feat.center[0]}));
    setAddressSuggestions([]);
  };

  const handleSubmit = async () => {
    try {
      const user = auth.currentUser;
      const docRef = await addDoc(collection(db, 'listings'), {
        ...formData,
        createdAt: Timestamp.now(),
        uid: user ? user.uid : null
      });
      alert('Listing created! ID: ' + docRef.id);
    } catch (err) {
      console.error(err);
      alert('Failed to create listing');
    }
  };

  // Render step components
  return (
    <div className="page-container" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h1>Tell us about your Sublease</h1>
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
          </div>

          {/* Campus & Address Section */}
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
            <div className="form-group">
              <label>Street Address:</label>
              <div style={{position:'relative',flex:1}}>
                <input type="text" className="input-13" value={formData.address} onChange={handleAddressInput} placeholder="123 Main St" style={{marginLeft:'10px',width:'100%'}} />
                {addressSuggestions.length>0 && (
                  <ul style={{position:'absolute',zIndex:1000,background:'#fff',listStyle:'none',margin:0,padding:'5px',border:'1px solid #d5d9d9',borderRadius:'6px',width:'100%',maxHeight:'180px',overflowY:'auto'}}>
                    {addressSuggestions.map((f)=>(
                      <li key={f.id} style={{padding:'5px',cursor:'pointer'}} onClick={()=>selectSuggestion(f)}>
                        {f.place_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Unit Details Section */}
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
          </div>

          <button className="button-13 save" style={{alignSelf:'center',marginTop:'1rem'}} onClick={handleNext}>Next</button>
        </div>
      )}

      {step === 1 && (
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

      {step === 2 && (
        <div style={{display:'flex',flexDirection:'column',gap:'2rem',alignItems:'flex-start',width:'100%'}}>
          {/* Photos Container */}
          <div style={{background:'#fff',borderRadius:'8px',padding:'1.5rem',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',width:'100%'}}>
            <h3 style={{margin:'0 0 0.5rem 0'}}>Photos</h3>
            <input
              type="file"
              multiple
              accept="image/*"
              style={{display:'none'}}
              ref={fileInputRef}
              onChange={(e)=>{
                handlePhotoUpload(e.target.files);
                e.target.value=null; // reset so same file can be reselected if needed
              }}
            />
            <button type="button" className="button-13 save" onClick={()=>fileInputRef.current && fileInputRef.current.click()}>
              Add Photos
            </button>
            <p style={{marginTop:'10px'}}>{formData.photos.length} photo(s) selected</p>

            {formData.photos.length > 0 && (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:'10px',marginTop:'10px'}}>
                {formData.photos.map((url,i)=>(
                  <img key={i} src={url} alt={`photo-${i}`} style={{width:'100%',height:'100px',objectFit:'cover',borderRadius:'6px'}} />
                ))}
              </div>
            )}
          </div>

          <div style={{alignSelf:'center'}}>
            <button className="button-13" onClick={handleBack}>Back</button>{' '}
            <button className="button-13 save" onClick={handleNext}>Next</button>
          </div>
        </div>
      )}

      {step === 3 && (
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
          <button className="button-13 save" onClick={handleSubmit}>Submit</button>
        </div>
      )}
    </div>
  );
}

export default Upload; 