'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import CandidateSidebar from '@/components/candidate/CandidateSidebar';

// ─── India States & Districts ─────────────────────────────────────────────────
const INDIA_STATES = {
  "Andhra Pradesh": ["Anantapur","Chittoor","East Godavari","Guntur","Krishna","Kurnool","Prakasam","Srikakulam","Sri Potti Sriramulu Nellore","Visakhapatnam","Vizianagaram","West Godavari","YSR Kadapa"],
  "Arunachal Pradesh": ["Anjaw","Changlang","Dibang Valley","East Kameng","East Siang","Kamle","Kra Daadi","Kurung Kumey","Lepa Rada","Lohit","Longding","Lower Dibang Valley","Lower Siang","Lower Subansiri","Namsai","Pakke Kessang","Papum Pare","Shi Yomi","Siang","Tawang","Tirap","Upper Dibang Valley","Upper Siang","Upper Subansiri","West Kameng","West Siang"],
  "Assam": ["Baksa","Barpeta","Biswanath","Bongaigaon","Cachar","Charaideo","Chirang","Darrang","Dhemaji","Dhubri","Dibrugarh","Dima Hasao","Goalpara","Golaghat","Hailakandi","Hojai","Jorhat","Kamrup","Kamrup Metropolitan","Karbi Anglong","Karimganj","Kokrajhar","Lakhimpur","Majuli","Morigaon","Nagaon","Nalbari","Sivasagar","Sonitpur","South Salmara-Mankachar","Tinsukia","Udalguri","West Karbi Anglong"],
  "Bihar": ["Araria","Arwal","Aurangabad","Banka","Begusarai","Bhagalpur","Bhojpur","Buxar","Darbhanga","East Champaran","Gaya","Gopalganj","Jamui","Jehanabad","Kaimur","Katihar","Khagaria","Kishanganj","Lakhisarai","Madhepura","Madhubani","Munger","Muzaffarpur","Nalanda","Nawada","Patna","Purnia","Rohtas","Saharsa","Samastipur","Saran","Sheikhpura","Sheohar","Sitamarhi","Siwan","Supaul","Vaishali","West Champaran"],
  "Chhattisgarh": ["Balod","Baloda Bazar","Balrampur","Bastar","Bemetara","Bijapur","Bilaspur","Dantewada","Dhamtari","Durg","Gariyaband","Gaurela-Pendra-Marwahi","Janjgir-Champa","Jashpur","Kabirdham","Kanker","Khairagarh","Kondagaon","Korba","Koriya","Mahasamund","Manendragarh","Mohla-Manpur","Mungeli","Narayanpur","Raigarh","Raipur","Rajnandgaon","Sakti","Sarangarh-Bilaigarh","Sukma","Surajpur","Surguja"],
  "Goa": ["North Goa","South Goa"],
  "Gujarat": ["Ahmedabad","Amreli","Anand","Aravalli","Banaskantha","Bharuch","Bhavnagar","Botad","Chhota Udaipur","Dahod","Dang","Devbhoomi Dwarka","Gandhinagar","Gir Somnath","Jamnagar","Junagadh","Kheda","Kutch","Mahisagar","Mehsana","Morbi","Narmada","Navsari","Panchmahal","Patan","Porbandar","Rajkot","Sabarkantha","Surat","Surendranagar","Tapi","Vadodara","Valsad"],
  "Haryana": ["Ambala","Bhiwani","Charkhi Dadri","Faridabad","Fatehabad","Gurugram","Hisar","Jhajjar","Jind","Kaithal","Karnal","Kurukshetra","Mahendragarh","Nuh","Palwal","Panchkula","Panipat","Rewari","Rohtak","Sirsa","Sonipat","Yamunanagar"],
  "Himachal Pradesh": ["Bilaspur","Chamba","Hamirpur","Kangra","Kinnaur","Kullu","Lahaul and Spiti","Mandi","Shimla","Sirmaur","Solan","Una"],
  "Jharkhand": ["Bokaro","Chatra","Deoghar","Dhanbad","Dumka","East Singhbhum","Garhwa","Giridih","Godda","Gumla","Hazaribagh","Jamtara","Khunti","Koderma","Latehar","Lohardaga","Pakur","Palamu","Ramgarh","Ranchi","Sahibganj","Seraikela Kharsawan","Simdega","West Singhbhum"],
  "Karnataka": ["Bagalkot","Ballari","Belagavi","Bengaluru Rural","Bengaluru Urban","Bidar","Chamarajanagar","Chikkaballapura","Chikkamagaluru","Chitradurga","Dakshina Kannada","Davanagere","Dharwad","Gadag","Hassan","Haveri","Kalaburagi","Kodagu","Kolar","Koppal","Mandya","Mysuru","Raichur","Ramanagara","Shivamogga","Tumakuru","Udupi","Uttara Kannada","Vijayapura","Yadgir"],
  "Kerala": ["Alappuzha","Ernakulam","Idukki","Kannur","Kasaragod","Kollam","Kottayam","Kozhikode","Malappuram","Palakkad","Pathanamthitta","Thiruvananthapuram","Thrissur","Wayanad"],
  "Madhya Pradesh": ["Agar Malwa","Alirajpur","Anuppur","Ashoknagar","Balaghat","Barwani","Betul","Bhind","Bhopal","Burhanpur","Chhatarpur","Chhindwara","Damoh","Datia","Dewas","Dhar","Dindori","Guna","Gwalior","Harda","Hoshangabad","Indore","Jabalpur","Jhabua","Katni","Khandwa","Khargone","Mandla","Mandsaur","Morena","Narsinghpur","Neemuch","Niwari","Panna","Raisen","Rajgarh","Ratlam","Rewa","Sagar","Satna","Sehore","Seoni","Shahdol","Shajapur","Sheopur","Shivpuri","Sidhi","Singrauli","Tikamgarh","Ujjain","Umaria","Vidisha"],
  "Maharashtra": ["Ahmednagar","Akola","Amravati","Aurangabad","Beed","Bhandara","Buldhana","Chandrapur","Dhule","Gadchiroli","Gondia","Hingoli","Jalgaon","Jalna","Kolhapur","Latur","Mumbai City","Mumbai Suburban","Nagpur","Nanded","Nandurbar","Nashik","Osmanabad","Palghar","Parbhani","Pune","Raigad","Ratnagiri","Sangli","Satara","Sindhudurg","Solapur","Thane","Wardha","Washim","Yavatmal"],
  "Manipur": ["Bishnupur","Chandel","Churachandpur","Imphal East","Imphal West","Jiribam","Kakching","Kamjong","Kangpokpi","Noney","Pherzawl","Senapati","Tamenglong","Tengnoupal","Thoubal","Ukhrul"],
  "Meghalaya": ["East Garo Hills","East Jaintia Hills","East Khasi Hills","North Garo Hills","Ri Bhoi","South Garo Hills","South West Garo Hills","South West Khasi Hills","West Garo Hills","West Jaintia Hills","West Khasi Hills"],
  "Mizoram": ["Aizawl","Champhai","Hnahthial","Khawzawl","Kolasib","Lawngtlai","Lunglei","Mamit","Saitual","Serchhip"],
  "Nagaland": ["Chumoukedima","Dimapur","Kiphire","Kohima","Longleng","Mokokchung","Mon","Niuland","Noklak","Peren","Phek","Shamator","Tseminyu","Tuensang","Wokha","Zunheboto"],
  "Odisha": ["Angul","Balangir","Balasore","Bargarh","Bhadrak","Boudh","Cuttack","Deogarh","Dhenkanal","Gajapati","Ganjam","Jagatsinghpur","Jajpur","Jharsuguda","Kalahandi","Kandhamal","Kendrapara","Kendujhar","Khurda","Koraput","Malkangiri","Mayurbhanj","Nabarangpur","Nayagarh","Nuapada","Puri","Rayagada","Sambalpur","Sonepur","Sundargarh"],
  "Punjab": ["Amritsar","Barnala","Bathinda","Faridkot","Fatehgarh Sahib","Fazilka","Ferozepur","Gurdaspur","Hoshiarpur","Jalandhar","Kapurthala","Ludhiana","Malerkotla","Mansa","Moga","Mohali","Muktsar","Pathankot","Patiala","Rupnagar","Sangrur","Shahid Bhagat Singh Nagar","Tarn Taran"],
  "Rajasthan": ["Ajmer","Alwar","Banswara","Baran","Barmer","Bharatpur","Bhilwara","Bikaner","Bundi","Chittorgarh","Churu","Dausa","Dholpur","Dungarpur","Ganganagar","Hanumangarh","Jaipur","Jaisalmer","Jalore","Jhalawar","Jhunjhunu","Jodhpur","Karauli","Kota","Nagaur","Pali","Pratapgarh","Rajsamand","Sawai Madhopur","Sikar","Sirohi","Tonk","Udaipur"],
  "Sikkim": ["East Sikkim","North Sikkim","Pakyong","Soreng","South Sikkim","West Sikkim"],
  "Tamil Nadu": ["Ariyalur","Chengalpattu","Chennai","Coimbatore","Cuddalore","Dharmapuri","Dindigul","Erode","Kallakurichi","Kancheepuram","Kanyakumari","Karur","Krishnagiri","Madurai","Mayiladuthurai","Nagapattinam","Namakkal","Nilgiris","Perambalur","Pudukkottai","Ramanathapuram","Ranipet","Salem","Sivaganga","Tenkasi","Thanjavur","Theni","Thoothukudi","Tiruchirappalli","Tirunelveli","Tirupathur","Tiruppur","Tiruvallur","Tiruvannamalai","Tiruvarur","Vellore","Viluppuram","Virudhunagar"],
  "Telangana": ["Adilabad","Bhadradri Kothagudem","Hyderabad","Jagtial","Jangaon","Jayashankar Bhupalpally","Jogulamba Gadwal","Kamareddy","Karimnagar","Khammam","Komaram Bheem","Mahabubabad","Mahbubnagar","Mancherial","Medak","Medchal–Malkajgiri","Mulugu","Nagarkurnool","Nalgonda","Narayanpet","Nirmal","Nizamabad","Peddapalli","Rajanna Sircilla","Rangareddy","Sangareddy","Siddipet","Suryapet","Vikarabad","Wanaparthy","Warangal Rural","Warangal Urban","Yadadri Bhuvanagiri"],
  "Tripura": ["Dhalai","Gomati","Khowai","North Tripura","Sepahijala","South Tripura","Unakoti","West Tripura"],
  "Uttar Pradesh": ["Agra","Aligarh","Ambedkar Nagar","Amethi","Amroha","Auraiya","Ayodhya","Azamgarh","Baghpat","Bahraich","Ballia","Balrampur","Banda","Barabanki","Bareilly","Basti","Bhadohi","Bijnor","Budaun","Bulandshahr","Chandauli","Chitrakoot","Deoria","Etah","Etawah","Farrukhabad","Fatehpur","Firozabad","Gautam Buddha Nagar","Ghaziabad","Ghazipur","Gonda","Gorakhpur","Hamirpur","Hapur","Hardoi","Hathras","Jalaun","Jaunpur","Jhansi","Kannauj","Kanpur Dehat","Kanpur Nagar","Kasganj","Kaushambi","Kheri","Kushinagar","Lalitpur","Lucknow","Maharajganj","Mahoba","Mainpuri","Mathura","Mau","Meerut","Mirzapur","Moradabad","Muzaffarnagar","Pilibhit","Pratapgarh","Prayagraj","Raebareli","Rampur","Saharanpur","Sambhal","Sant Kabir Nagar","Shahjahanpur","Shamli","Shravasti","Siddharthnagar","Sitapur","Sonbhadra","Sultanpur","Unnao","Varanasi"],
  "Uttarakhand": ["Almora","Bageshwar","Chamoli","Champawat","Dehradun","Haridwar","Nainital","Pauri Garhwal","Pithoragarh","Rudraprayag","Tehri Garhwal","Udham Singh Nagar","Uttarkashi"],
  "West Bengal": ["Alipurduar","Bankura","Birbhum","Cooch Behar","Dakshin Dinajpur","Darjeeling","Hooghly","Howrah","Jalpaiguri","Jhargram","Kalimpong","Kolkata","Malda","Murshidabad","Nadia","North 24 Parganas","Paschim Bardhaman","Paschim Medinipur","Purba Bardhaman","Purba Medinipur","Purulia","South 24 Parganas","Uttar Dinajpur"],
  "Andaman and Nicobar Islands": ["Nicobar","North and Middle Andaman","South Andaman"],
  "Chandigarh": ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Dadra and Nagar Haveli","Daman","Diu"],
  "Delhi": ["Central Delhi","East Delhi","New Delhi","North Delhi","North East Delhi","North West Delhi","Shahdara","South Delhi","South East Delhi","South West Delhi","West Delhi"],
  "Jammu and Kashmir": ["Anantnag","Bandipora","Baramulla","Budgam","Doda","Ganderbal","Jammu","Kathua","Kishtwar","Kulgam","Kupwara","Poonch","Pulwama","Rajouri","Ramban","Reasi","Samba","Shopian","Srinagar","Udhampur"],
  "Ladakh": ["Kargil","Leh"],
  "Lakshadweep": ["Lakshadweep"],
  "Puducherry": ["Karaikal","Mahe","Puducherry","Yanam"],
};

// ─── Validation helpers ────────────────────────────────────────────────────────
function validatePage1(data) {
  const errors = {};
  if (!data.name?.trim()) errors.name = 'Name is required';
  if (!data.phone?.trim()) errors.phone = 'Phone is required';
  if (!data.email?.trim()) errors.email = 'Email is required';
  if (!data.state) errors.state = 'State is required';
  if (!data.district) errors.district = 'District is required';
  return errors;
}

function validatePage2(data) {
  const errors = {};
  if (!data.degree?.trim()) errors.degree = 'Degree is required';
  if (!data.institution?.trim()) errors.institution = 'Institution is required';
  if (!data.year?.trim()) errors.year = 'Year of passing is required';
  if (!data.percentage?.trim()) errors.percentage = 'Percentage/CGPA is required';
  return errors;
}

function validatePage3(data) {
  const errors = {};
  if (!data.skills || data.skills.length === 0) errors.skills = 'At least one skill is required';
  return errors;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ResumeBuilderPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [errors, setErrors] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('classic'); // 'classic' | 'modern'

  // ─── Form Data ─────────────────────────────────────────────────────────────
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [page1, setPage1] = useState({
    name: '', phone: '', email: '', career_objective: '',
    address: '', state: '', district: '',
  });

  const [page2, setPage2] = useState({
    degree: '', institution: '', board: '', year: '', percentage: '',
    // 10th
    school_name: '', school_board: '', school_year: '', school_percentage: '',
    // Projects (up to 3)
    projects: [{ title: '', description: '', tech: '' }],
  });

  const [page3, setPage3] = useState({
    skills: [],
    skillInput: '',
    experience: [{ company: '', role: '', duration: '', description: '' }],
    strengths: [''],
    languages: ['Tamil', 'English'],
    langInput: '',
    declaration: 'I hereby declare that all the information given above is true and correct to the best of my knowledge and belief.',
  });

  // ─── Load candidate data ────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const stored = localStorage.getItem('candidate_user');
        if (!stored) { router.push('/'); return; }
        const cand = JSON.parse(stored);
        setCandidate(cand);

        const { data } = await supabase
          .from('candidates')
          .select('*')
          .eq('id', cand.id)
          .single();

        if (data) {
          setPage1({
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || '',
            career_objective: data.career_objective || '',
            address: data.address || '',
            state: data.state || '',
            district: data.district || '',
          });
          if (data.skills?.length) setPage3(p => ({ ...p, skills: data.skills }));
          if (data.photo_url) setPhotoPreview(data.photo_url);
          if (data.resume_data) {
            try {
              const rd = JSON.parse(data.resume_data);
              if (rd.page2) setPage2(p => ({ ...p, ...rd.page2 }));
              if (rd.page3) setPage3(p => ({ ...p, ...rd.page3, skills: data.skills || rd.page3.skills || [] }));
              if (rd.template) setSelectedTemplate(rd.template);
            } catch {}
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ─── Photo upload ───────────────────────────────────────────────────────────
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ─── Navigation with validation ────────────────────────────────────────────
  const goToPage = (target) => {
    if (target > currentPage) {
      // validate all pages before target
      for (let pg = currentPage; pg < target; pg++) {
        let errs = {};
        if (pg === 1) errs = validatePage1(page1);
        if (pg === 2) errs = validatePage2(page2);
        if (pg === 3) errs = validatePage3(page3);
        if (Object.keys(errs).length > 0) {
          setErrors(errs);
          setCurrentPage(pg);
          return;
        }
      }
    }
    setErrors({});
    setCurrentPage(target);
  };

  // ─── Skills tag input ───────────────────────────────────────────────────────
  const handleSkillKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && page3.skillInput.trim()) {
      e.preventDefault();
      const skill = page3.skillInput.trim().replace(/,$/, '');
      if (skill && !page3.skills.includes(skill)) {
        setPage3(p => ({ ...p, skills: [...p.skills, skill], skillInput: '' }));
      } else {
        setPage3(p => ({ ...p, skillInput: '' }));
      }
    }
  };
  const removeSkill = (s) => setPage3(p => ({ ...p, skills: p.skills.filter(x => x !== s) }));

  // ─── Language management ────────────────────────────────────────────────────
  const addLanguage = () => {
    const lang = page3.langInput.trim();
    if (lang && !page3.languages.includes(lang)) {
      setPage3(p => ({ ...p, languages: [...p.languages, lang], langInput: '' }));
    }
  };
  const removeLang = (l) => setPage3(p => ({ ...p, languages: p.languages.filter(x => x !== l) }));

  // ─── Strengths ──────────────────────────────────────────────────────────────
  const updateStrength = (i, val) => {
    const s = [...page3.strengths];
    s[i] = val;
    setPage3(p => ({ ...p, strengths: s }));
  };
  const addStrength = () => {
    if (page3.strengths.length < 3) setPage3(p => ({ ...p, strengths: [...p.strengths, ''] }));
  };
  const removeStrength = (i) => setPage3(p => ({ ...p, strengths: p.strengths.filter((_, idx) => idx !== i) }));

  // ─── Projects ───────────────────────────────────────────────────────────────
  const updateProject = (i, field, val) => {
    const proj = [...page2.projects];
    proj[i] = { ...proj[i], [field]: val };
    setPage2(p => ({ ...p, projects: proj }));
  };
  const addProject = () => {
    if (page2.projects.length < 3) setPage2(p => ({ ...p, projects: [...p.projects, { title: '', description: '', tech: '' }] }));
  };
  const removeProject = (i) => setPage2(p => ({ ...p, projects: p.projects.filter((_, idx) => idx !== i) }));

  // ─── Experience ─────────────────────────────────────────────────────────────
  const updateExp = (i, field, val) => {
    const exp = [...page3.experience];
    exp[i] = { ...exp[i], [field]: val };
    setPage3(p => ({ ...p, experience: exp }));
  };
  const addExp = () => setPage3(p => ({ ...p, experience: [...p.experience, { company: '', role: '', duration: '', description: '' }] }));
  const removeExp = (i) => setPage3(p => ({ ...p, experience: p.experience.filter((_, idx) => idx !== i) }));

  // ─── Save to Supabase ───────────────────────────────────────────────────────
  const saveProfile = async () => {
    setSaving(true);
    try {
      let photo_url = photoPreview;
      if (photoFile && candidate) {
        const ext = photoFile.name.split('.').pop();
        const path = `photos/${candidate.id}.${ext}`;
        const { error: upErr } = await supabase.storage.from('resumes').upload(path, photoFile, { upsert: true });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(path);
          photo_url = urlData?.publicUrl;
        }
      }

      const resume_data = JSON.stringify({ page2, page3: { ...page3, skillInput: '', langInput: '' }, template: selectedTemplate });

      await supabase.from('candidates').update({
        name: page1.name,
        phone: page1.phone,
        email: page1.email,
        career_objective: page1.career_objective,
        address: page1.address,
        state: page1.state,
        district: page1.district,
        skills: page3.skills,
        photo_url,
        resume_data,
        education: `${page2.degree} - ${page2.institution} (${page2.year})`,
      }).eq('id', candidate.id);

      alert('Profile saved successfully!');
    } catch (e) {
      console.error(e);
      alert('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading ────────────────────────────────────────────────────────────────
  // Don't render anything until auth check is done — prevents 404 flash
  if (loading) return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  const tabs = [
    { label: 'Personal Info', page: 1 },
    { label: 'Education & Projects', page: 2 },
    { label: 'Skills & More', page: 3 },
    { label: 'Preview & Download', page: 4 },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <CandidateSidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Resume Builder</h1>
            <p className="text-gray-500 text-sm mt-1">Build your professional resume step by step</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-white rounded-xl shadow-sm mb-6 overflow-hidden border border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.page}
                onClick={() => goToPage(tab.page)}
                className={`flex-1 py-3 px-2 text-sm font-medium transition-all border-b-2 ${
                  currentPage === tab.page
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : currentPage > tab.page
                    ? 'border-green-500 text-green-600 bg-green-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs mr-1 ${
                  currentPage > tab.page ? 'bg-green-500 text-white' : currentPage === tab.page ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>{currentPage > tab.page ? '✓' : tab.page}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── PAGE 1: Personal Info ── */}
          {currentPage === 1 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-5">Personal Information</h2>

              {/* Photo upload */}
              <div className="flex items-center gap-5 mb-6">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-full border-2 border-dashed border-blue-300 flex items-center justify-center cursor-pointer overflow-hidden bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <div className="text-2xl">📷</div>
                      <div className="text-xs text-blue-600 mt-1">Upload Photo</div>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Profile Photo</p>
                  <p className="text-xs text-gray-400 mt-1">Click to upload from device</p>
                  <p className="text-xs text-gray-400">JPG, PNG — max 2MB</p>
                  {photoPreview && (
                    <button onClick={() => { setPhotoPreview(null); setPhotoFile(null); }} className="text-xs text-red-500 mt-1 hover:underline">Remove</button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input
                    value={page1.name}
                    onChange={e => setPage1(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Swetha K"
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                  <input
                    value={page1.phone}
                    onChange={e => setPage1(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 9876543210"
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.phone ? 'border-red-400' : 'border-gray-300'}`}
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                  <input
                    value={page1.email}
                    onChange={e => setPage1(p => ({ ...p, email: e.target.value }))}
                    placeholder="name@email.com"
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address / Street</label>
                  <input
                    value={page1.address}
                    onChange={e => setPage1(p => ({ ...p, address: e.target.value }))}
                    placeholder="Door no, Street name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                  <select
                    value={page1.state}
                    onChange={e => setPage1(p => ({ ...p, state: e.target.value, district: '' }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.state ? 'border-red-400' : 'border-gray-300'}`}
                  >
                    <option value="">Select State</option>
                    {Object.keys(INDIA_STATES).sort().map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
                </div>

                {/* District */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">District <span className="text-red-500">*</span></label>
                  <select
                    value={page1.district}
                    onChange={e => setPage1(p => ({ ...p, district: e.target.value }))}
                    disabled={!page1.state}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 ${errors.district ? 'border-red-400' : 'border-gray-300'}`}
                  >
                    <option value="">Select District</option>
                    {(INDIA_STATES[page1.state] || []).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.district && <p className="text-xs text-red-500 mt-1">{errors.district}</p>}
                </div>
              </div>

              {/* Career Objective */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Career Objective</label>
                <textarea
                  value={page1.career_objective}
                  onChange={e => setPage1(p => ({ ...p, career_objective: e.target.value }))}
                  rows={3}
                  placeholder="Write a brief career objective statement..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{page1.career_objective.length}/300 characters</p>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => goToPage(2)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Next: Education & Projects →
                </button>
              </div>
            </div>
          )}

          {/* ── PAGE 2: Education & Projects ── */}
          {currentPage === 2 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-800">Education Details</h2>

              {/* UG / Degree */}
              <div>
                <h3 className="text-sm font-semibold text-blue-700 mb-3 uppercase tracking-wide">UG / Degree / Diploma</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Degree / Course <span className="text-red-500">*</span></label>
                    <input value={page2.degree} onChange={e => setPage2(p => ({ ...p, degree: e.target.value }))}
                      placeholder="e.g. B.E. Computer Science"
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.degree ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {errors.degree && <p className="text-xs text-red-500 mt-1">{errors.degree}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Institution <span className="text-red-500">*</span></label>
                    <input value={page2.institution} onChange={e => setPage2(p => ({ ...p, institution: e.target.value }))}
                      placeholder="College / University name"
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.institution ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {errors.institution && <p className="text-xs text-red-500 mt-1">{errors.institution}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Board / University</label>
                    <input value={page2.board} onChange={e => setPage2(p => ({ ...p, board: e.target.value }))}
                      placeholder="e.g. Anna University"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year of Passing <span className="text-red-500">*</span></label>
                    <input value={page2.year} onChange={e => setPage2(p => ({ ...p, year: e.target.value }))}
                      placeholder="e.g. 2024"
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.year ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {errors.year && <p className="text-xs text-red-500 mt-1">{errors.year}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Percentage / CGPA <span className="text-red-500">*</span></label>
                    <input value={page2.percentage} onChange={e => setPage2(p => ({ ...p, percentage: e.target.value }))}
                      placeholder="e.g. 85% or 8.5 CGPA"
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.percentage ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {errors.percentage && <p className="text-xs text-red-500 mt-1">{errors.percentage}</p>}
                  </div>
                </div>
              </div>

              {/* 10th / HSC */}
              <div>
                <h3 className="text-sm font-semibold text-blue-700 mb-3 uppercase tracking-wide">10th / HSC / Higher Secondary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                    <input value={page2.school_name} onChange={e => setPage2(p => ({ ...p, school_name: e.target.value }))}
                      placeholder="School name"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Board</label>
                    <input value={page2.school_board} onChange={e => setPage2(p => ({ ...p, school_board: e.target.value }))}
                      placeholder="e.g. Tamil Nadu State Board"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year of Passing</label>
                    <input value={page2.school_year} onChange={e => setPage2(p => ({ ...p, school_year: e.target.value }))}
                      placeholder="e.g. 2020"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Percentage</label>
                    <input value={page2.school_percentage} onChange={e => setPage2(p => ({ ...p, school_percentage: e.target.value }))}
                      placeholder="e.g. 90%"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>
              </div>

              {/* Projects */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Projects</h3>
                  {page2.projects.length < 3 && (
                    <button onClick={addProject} className="text-xs text-blue-600 border border-blue-300 px-2 py-1 rounded hover:bg-blue-50">+ Add Project</button>
                  )}
                </div>
                {page2.projects.map((proj, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 mb-3 relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">Project {i + 1}</span>
                      {page2.projects.length > 1 && (
                        <button onClick={() => removeProject(i)} className="text-xs text-red-500 hover:underline">Remove</button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Project Title</label>
                        <input value={proj.title} onChange={e => updateProject(i, 'title', e.target.value)}
                          placeholder="e.g. E-Commerce Website"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Technologies Used</label>
                        <input value={proj.tech} onChange={e => updateProject(i, 'tech', e.target.value)}
                          placeholder="e.g. React, Node.js, MongoDB"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                        <textarea value={proj.description} onChange={e => updateProject(i, 'description', e.target.value)}
                          rows={2} placeholder="Brief description of the project..."
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <button onClick={() => goToPage(1)} className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50">← Back</button>
                <button onClick={() => goToPage(3)} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Next: Skills & More →</button>
              </div>
            </div>
          )}

          {/* ── PAGE 3: Skills, Experience, Strength, Languages, Declaration ── */}
          {currentPage === 3 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-800">Skills & More</h2>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skills <span className="text-red-500">*</span></label>
                <div className={`flex flex-wrap gap-2 border rounded-lg p-3 min-h-[48px] ${errors.skills ? 'border-red-400' : 'border-gray-300'}`}>
                  {page3.skills.map(s => (
                    <span key={s} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      {s}
                      <button onClick={() => removeSkill(s)} className="hover:text-red-500 font-bold leading-none">×</button>
                    </span>
                  ))}
                  <input
                    value={page3.skillInput}
                    onChange={e => setPage3(p => ({ ...p, skillInput: e.target.value }))}
                    onKeyDown={handleSkillKeyDown}
                    placeholder={page3.skills.length === 0 ? 'Type skill and press Enter...' : ''}
                    className="flex-1 min-w-[120px] outline-none text-sm"
                  />
                </div>
                {errors.skills && <p className="text-xs text-red-500 mt-1">{errors.skills}</p>}
                <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add each skill</p>
              </div>

              {/* Experience */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Work Experience <span className="text-gray-400 text-xs font-normal">(optional)</span></label>
                  <button onClick={addExp} className="text-xs text-blue-600 border border-blue-300 px-2 py-1 rounded hover:bg-blue-50">+ Add</button>
                </div>
                {page3.experience.map((exp, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 mb-3">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs text-gray-500">Experience {i + 1}</span>
                      {page3.experience.length > 1 && (
                        <button onClick={() => removeExp(i)} className="text-xs text-red-500 hover:underline">Remove</button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Company Name</label>
                        <input value={exp.company} onChange={e => updateExp(i, 'company', e.target.value)}
                          placeholder="Company / Organization"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Role / Designation</label>
                        <input value={exp.role} onChange={e => updateExp(i, 'role', e.target.value)}
                          placeholder="e.g. Software Intern"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
                        <input value={exp.duration} onChange={e => updateExp(i, 'duration', e.target.value)}
                          placeholder="e.g. Jan 2023 – Jun 2023"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                        <input value={exp.description} onChange={e => updateExp(i, 'description', e.target.value)}
                          placeholder="Brief role description"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Strengths */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Strengths <span className="text-gray-400 text-xs font-normal">(max 3, optional)</span></label>
                  {page3.strengths.length < 3 && (
                    <button onClick={addStrength} className="text-xs text-blue-600 border border-blue-300 px-2 py-1 rounded hover:bg-blue-50">+ Add</button>
                  )}
                </div>
                {page3.strengths.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <span className="text-gray-400 text-sm">•</span>
                    <input value={s} onChange={e => updateStrength(i, e.target.value)}
                      placeholder={`Strength ${i + 1} (e.g. Quick Learner)`}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    {page3.strengths.length > 1 && (
                      <button onClick={() => removeStrength(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                    )}
                  </div>
                ))}
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Languages Known</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {page3.languages.map(l => (
                    <span key={l} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      {l}
                      <button onClick={() => removeLang(l)} className="hover:text-red-500 font-bold">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={page3.langInput}
                    onChange={e => setPage3(p => ({ ...p, langInput: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLanguage(); } }}
                    placeholder="Add another language..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button onClick={addLanguage} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200">Add</button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Tamil and English are pre-added. You can remove them if needed.</p>
              </div>

              {/* Declaration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Declaration <span className="text-gray-400 text-xs font-normal">(editable)</span></label>
                <textarea
                  value={page3.declaration}
                  onChange={e => setPage3(p => ({ ...p, declaration: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>

              <div className="flex justify-between">
                <button onClick={() => goToPage(2)} className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50">← Back</button>
                <button onClick={() => goToPage(4)} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Preview & Download →</button>
              </div>
            </div>
          )}

          {/* ── PAGE 4: Preview & Download ── */}
          {currentPage === 4 && (
            <div className="space-y-6">
              {/* Template selector */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Choose Template</h2>
                <div className="flex gap-4">
                  {[
                    { id: 'classic', label: 'Classic (B&W)', desc: 'Simple, clean, traditional' },
                    { id: 'modern', label: 'Modern (Blue)', desc: 'Sidebar accent, professional' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`flex-1 border-2 rounded-xl p-4 text-left transition-all ${selectedTemplate === t.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="font-medium text-sm text-gray-800">{t.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* A4 Preview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-700">Resume Preview</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="border border-blue-300 text-blue-600 px-4 py-2 rounded-lg text-sm hover:bg-blue-50 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : '💾 Save to Profile'}
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                    >
                      📄 Download PDF
                    </button>
                  </div>
                </div>

                {/* A4 Paper */}
                <div className="flex justify-center overflow-auto">
                  <div id="resume-preview" style={{ width: '210mm', minHeight: '297mm', backgroundColor: 'white', fontFamily: 'Arial, sans-serif', fontSize: '11pt', padding: '12mm', boxShadow: '0 0 20px rgba(0,0,0,0.15)', position: 'relative' }}>
                    {selectedTemplate === 'classic' ? (
                      <ClassicTemplate page1={page1} page2={page2} page3={page3} photoPreview={photoPreview} />
                    ) : (
                      <ModernTemplate page1={page1} page2={page2} page3={page3} photoPreview={photoPreview} />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => goToPage(3)} className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50">← Back</button>
                <button
                  onClick={() => router.push('/candidate/skill-test')}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  Take Skill Test →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #resume-preview, #resume-preview * { visibility: visible !important; }
          #resume-preview {
            position: fixed !important;
            left: 0 !important; top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 12mm !important;
            box-shadow: none !important;
            font-size: 11pt !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Classic Template ──────────────────────────────────────────────────────────
function ClassicTemplate({ page1, page2, page3, photoPreview }) {
  return (
    <div style={{ color: '#1a1a1a' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1a1a1a', paddingBottom: '8px', marginBottom: '10px' }}>
        <div>
          <h1 style={{ fontSize: '20pt', fontWeight: 'bold', margin: 0, letterSpacing: '1px' }}>{page1.name || 'Your Name'}</h1>
          <div style={{ fontSize: '9pt', color: '#444', marginTop: '4px' }}>
            {[page1.phone, page1.email, page1.district && page1.state ? `${page1.district}, ${page1.state}` : ''].filter(Boolean).join(' | ')}
          </div>
        </div>
        {photoPreview && (
          <img src={photoPreview} alt="Photo" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #1a1a1a' }} />
        )}
      </div>

      {/* Career Objective */}
      {page1.career_objective && (
        <Section title="Career Objective">
          <p style={{ margin: 0, fontSize: '9.5pt', lineHeight: '1.5' }}>{page1.career_objective}</p>
        </Section>
      )}

      {/* Education */}
      <Section title="Education">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              {['Qualification', 'Institution', 'Board/University', 'Year', 'Percentage'].map(h => (
                <th key={h} style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'left', fontWeight: '600' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {page2.degree && (
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '4px 6px' }}>{page2.degree}</td>
                <td style={{ border: '1px solid #ccc', padding: '4px 6px' }}>{page2.institution}</td>
                <td style={{ border: '1px solid #ccc', padding: '4px 6px' }}>{page2.board}</td>
                <td style={{ border: '1px solid #ccc', padding: '4px 6px' }}>{page2.year}</td>
                <td style={{ border: '1px solid #ccc', padding: '4px 6px' }}>{page2.percentage}</td>
              </tr>
            )}
            {page2.school_name && (
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '4px 6px' }}>10th / HSC</td>
                <td style={{ border: '1px solid #ccc', padding: '4px 6px' }}>{page2.school_name}</td>
                <td style={{ border: '1px solid #ccc', padding: '4px 6px' }}>{page2.school_board}</td>
                <td style={{ border: '1px solid #ccc', padding: '4px 6px' }}>{page2.school_year}</td>
                <td style={{ border: '1px solid #ccc', padding: '4px 6px' }}>{page2.school_percentage}</td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>

      {/* Skills */}
      {page3.skills.length > 0 && (
        <Section title="Technical Skills">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {page3.skills.map(s => (
              <span key={s} style={{ border: '1px solid #999', borderRadius: '3px', padding: '2px 6px', fontSize: '9pt' }}>{s}</span>
            ))}
          </div>
        </Section>
      )}

      {/* Strengths */}
      {page3.strengths.filter(Boolean).length > 0 && (
        <Section title="Strengths">
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '9.5pt' }}>
            {page3.strengths.filter(Boolean).map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </Section>
      )}

      {/* Projects */}
      {page2.projects.filter(p => p.title).length > 0 && (
        <Section title="Projects">
          {page2.projects.filter(p => p.title).map((proj, i) => (
            <div key={i} style={{ marginBottom: '6px' }}>
              <strong style={{ fontSize: '9.5pt' }}>{proj.title}</strong>
              {proj.tech && <span style={{ fontSize: '9pt', color: '#555' }}> — {proj.tech}</span>}
              {proj.description && <p style={{ margin: '2px 0 0 0', fontSize: '9pt', color: '#333' }}>{proj.description}</p>}
            </div>
          ))}
        </Section>
      )}

      {/* Experience */}
      {page3.experience.filter(e => e.company).length > 0 && (
        <Section title="Work Experience">
          {page3.experience.filter(e => e.company).map((exp, i) => (
            <div key={i} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '9.5pt' }}>{exp.role} — {exp.company}</strong>
                <span style={{ fontSize: '9pt', color: '#555' }}>{exp.duration}</span>
              </div>
              {exp.description && <p style={{ margin: '2px 0 0 0', fontSize: '9pt', color: '#333' }}>{exp.description}</p>}
            </div>
          ))}
        </Section>
      )}

      {/* Languages */}
      {page3.languages.length > 0 && (
        <Section title="Languages">
          <p style={{ margin: 0, fontSize: '9.5pt' }}>{page3.languages.join(', ')}</p>
        </Section>
      )}

      {/* Declaration */}
      {page3.declaration && (
        <Section title="Declaration">
          <p style={{ margin: 0, fontSize: '9pt', color: '#333' }}>{page3.declaration}</p>
          <div style={{ marginTop: '20px', textAlign: 'right', fontSize: '9pt' }}>
            <div>Place: {page1.district || '___________'}</div>
            <div style={{ marginTop: '4px' }}>Date: {new Date().toLocaleDateString('en-IN')}</div>
            <div style={{ marginTop: '16px', borderTop: '1px solid #000', paddingTop: '4px', width: '100px', marginLeft: 'auto' }}>Signature</div>
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── Modern Template ──────────────────────────────────────────────────────────
function ModernTemplate({ page1, page2, page3, photoPreview }) {
  return (
    <div style={{ display: 'flex', height: '100%', color: '#1a1a1a', gap: 0 }}>
      {/* Left sidebar */}
      <div style={{ width: '62mm', backgroundColor: '#1a3a5c', color: 'white', padding: '10mm 6mm', flexShrink: 0 }}>
        {/* Photo */}
        <div style={{ textAlign: 'center', marginBottom: '8mm' }}>
          {photoPreview ? (
            <img src={photoPreview} alt="Photo" style={{ width: '55px', height: '55px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white' }} />
          ) : (
            <div style={{ width: '55px', height: '55px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20pt' }}>👤</div>
          )}
          <h2 style={{ fontSize: '11pt', fontWeight: 'bold', margin: '6px 0 2px', lineHeight: 1.2 }}>{page1.name || 'Your Name'}</h2>
        </div>

        {/* Contact */}
        <div style={{ marginBottom: '6mm' }}>
          <SidebarSection title="Contact">
            {page1.phone && <p style={{ margin: '2px 0', fontSize: '8pt' }}>📞 {page1.phone}</p>}
            {page1.email && <p style={{ margin: '2px 0', fontSize: '8pt', wordBreak: 'break-all' }}>✉ {page1.email}</p>}
            {(page1.district || page1.state) && <p style={{ margin: '2px 0', fontSize: '8pt' }}>📍 {[page1.district, page1.state].filter(Boolean).join(', ')}</p>}
          </SidebarSection>
        </div>

        {/* Skills */}
        {page3.skills.length > 0 && (
          <div style={{ marginBottom: '6mm' }}>
            <SidebarSection title="Skills">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                {page3.skills.map(s => (
                  <span key={s} style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '3px', padding: '1px 5px', fontSize: '7.5pt' }}>{s}</span>
                ))}
              </div>
            </SidebarSection>
          </div>
        )}

        {/* Languages */}
        {page3.languages.length > 0 && (
          <div style={{ marginBottom: '6mm' }}>
            <SidebarSection title="Languages">
              {page3.languages.map(l => <p key={l} style={{ margin: '2px 0', fontSize: '8pt' }}>• {l}</p>)}
            </SidebarSection>
          </div>
        )}

        {/* Strengths */}
        {page3.strengths.filter(Boolean).length > 0 && (
          <SidebarSection title="Strengths">
            {page3.strengths.filter(Boolean).map((s, i) => <p key={i} style={{ margin: '2px 0', fontSize: '8pt' }}>• {s}</p>)}
          </SidebarSection>
        )}
      </div>

      {/* Right main content */}
      <div style={{ flex: 1, padding: '10mm 8mm' }}>
        {/* Career Objective */}
        {page1.career_objective && (
          <div style={{ marginBottom: '6mm' }}>
            <ModernSection title="Career Objective">
              <p style={{ margin: 0, fontSize: '9.5pt', lineHeight: 1.5, color: '#333' }}>{page1.career_objective}</p>
            </ModernSection>
          </div>
        )}

        {/* Education */}
        <div style={{ marginBottom: '6mm' }}>
          <ModernSection title="Education">
            {page2.degree && (
              <div style={{ marginBottom: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '9.5pt' }}>{page2.degree}</strong>
                  <span style={{ fontSize: '9pt', color: '#555' }}>{page2.year}</span>
                </div>
                <p style={{ margin: '1px 0', fontSize: '9pt', color: '#444' }}>{page2.institution}</p>
                {page2.percentage && <p style={{ margin: '1px 0', fontSize: '9pt', color: '#666' }}>{page2.percentage}</p>}
              </div>
            )}
            {page2.school_name && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '9.5pt' }}>10th / HSC</strong>
                  <span style={{ fontSize: '9pt', color: '#555' }}>{page2.school_year}</span>
                </div>
                <p style={{ margin: '1px 0', fontSize: '9pt', color: '#444' }}>{page2.school_name}</p>
                {page2.school_percentage && <p style={{ margin: '1px 0', fontSize: '9pt', color: '#666' }}>{page2.school_percentage}</p>}
              </div>
            )}
          </ModernSection>
        </div>

        {/* Projects */}
        {page2.projects.filter(p => p.title).length > 0 && (
          <div style={{ marginBottom: '6mm' }}>
            <ModernSection title="Projects">
              {page2.projects.filter(p => p.title).map((proj, i) => (
                <div key={i} style={{ marginBottom: '5px' }}>
                  <strong style={{ fontSize: '9.5pt' }}>{proj.title}</strong>
                  {proj.tech && <span style={{ fontSize: '9pt', color: '#1a3a5c' }}> | {proj.tech}</span>}
                  {proj.description && <p style={{ margin: '2px 0 0', fontSize: '9pt', color: '#444' }}>{proj.description}</p>}
                </div>
              ))}
            </ModernSection>
          </div>
        )}

        {/* Experience */}
        {page3.experience.filter(e => e.company).length > 0 && (
          <div style={{ marginBottom: '6mm' }}>
            <ModernSection title="Work Experience">
              {page3.experience.filter(e => e.company).map((exp, i) => (
                <div key={i} style={{ marginBottom: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '9.5pt' }}>{exp.role}</strong>
                    <span style={{ fontSize: '9pt', color: '#555' }}>{exp.duration}</span>
                  </div>
                  <p style={{ margin: '1px 0', fontSize: '9pt', color: '#444' }}>{exp.company}</p>
                  {exp.description && <p style={{ margin: '2px 0 0', fontSize: '9pt', color: '#555' }}>{exp.description}</p>}
                </div>
              ))}
            </ModernSection>
          </div>
        )}

        {/* Declaration */}
        {page3.declaration && (
          <ModernSection title="Declaration">
            <p style={{ margin: 0, fontSize: '9pt', color: '#444', lineHeight: 1.4 }}>{page3.declaration}</p>
            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', fontSize: '9pt', color: '#333' }}>
              <span>Place: {page1.district || '___________'}</span>
              <span>Date: {new Date().toLocaleDateString('en-IN')}</span>
            </div>
            <div style={{ marginTop: '16px', fontSize: '9pt' }}>
              <div style={{ borderTop: '1px solid #555', width: '80px', paddingTop: '3px' }}>Signature</div>
            </div>
          </ModernSection>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '8px' }}>
      <h3 style={{ fontSize: '10.5pt', fontWeight: 'bold', borderBottom: '1px solid #1a1a1a', paddingBottom: '2px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
      {children}
    </div>
  );
}

function SidebarSection({ title, children }) {
  return (
    <div>
      <h4 style={{ fontSize: '8.5pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '3px', marginBottom: '5px' }}>{title}</h4>
      {children}
    </div>
  );
}

function ModernSection({ title, children }) {
  return (
    <div>
      <h3 style={{ fontSize: '10pt', fontWeight: 'bold', color: '#1a3a5c', borderBottom: '2px solid #1a3a5c', paddingBottom: '2px', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
      {children}
    </div>
  );
}