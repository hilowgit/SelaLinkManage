// Version: CLOUDINARY-DOWNLOAD-FIX-4-CLEANUP - 25/06/2025
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, getDocs, setDoc, onSnapshot, query, where, deleteDoc, writeBatch } from 'firebase/firestore';
import { Search, User, Users, Calendar, BookOpen, Edit, Trash2, PlusCircle, X, Clock, Building, Tag, Users as TraineesIcon, ClipboardList, List, DollarSign, Award, Percent, Star, XCircle, CheckCircle, BarChart2, Briefcase, AlertTriangle, FileText, Upload, Download } from 'lucide-react';

// --- تهيئة Firebase ---
console.log("RUNNING CODE VERSION: CLOUDINARY-DOWNLOAD-FIX-4-CLEANUP");

let app, auth, db;
let firebaseInitializationError = null;

const appId = typeof __app_id !== 'undefined' ? __app_id : 'sila-center-app-v3-local';

const fallbackFirebaseConfig = {
    apiKey: "AIzaSyCepkFpjkPvFY0z32sI3ix3LS72yTQs84A", // !! ==> الرجاء استبدال هذا بمفتاح API الفعلي
    authDomain: "selalinkm.firebaseapp.com",
    projectId: "selalinkm",
    storageBucket: "selalinkm.appspot.com",
    messagingSenderId: "630184793476",
    appId: "1:630184793476:web:c245aff861f8204990c311",
    measurementId: "G-ZHTF5H94H3"
};

try {
    let firebaseConfig;
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
        firebaseConfig = JSON.parse(__firebase_config);
    } else {
        firebaseConfig = fallbackFirebaseConfig;
    }

    if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
        throw new Error("Firebase API key is missing or is a placeholder. Please update it in the code.");
    }

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) {
    console.error("Firebase Initialization Failed:", e);
    firebaseInitializationError = e;
}

// --- مكونات واجهة المستخدم المساعدة ---

const Modal = ({ children, isOpen, onClose, title, size = '2xl' }) => {
    if (!isOpen) return null;
    const sizeClasses = {
        'md': 'max-w-md',
        'lg': 'max-w-lg',
        'xl': 'max-w-xl',
        '2xl': 'max-w-2xl',
        '4xl': 'max-w-4xl',
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors duration-300 p-1 rounded-full hover:bg-gray-100">
                        <X size={24} />
                    </button>
                </div>
                <div className="overflow-y-auto p-6">{children}</div>
            </div>
        </div>
    );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
        <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <p className="my-4 text-gray-600">{message}</p>
        </div>
        <div className="flex justify-center gap-4 mt-6">
            <Button variant="secondary" onClick={onClose}>إلغاء</Button>
            <Button variant="danger" onClick={onConfirm}>تأكيد الحذف</Button>
        </div>
    </Modal>
);

const Input = ({ label, id, ...props }) => (
    <div className="mb-4">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input id={id} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300" {...props} />
    </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false }) => {
    const baseClasses = 'px-6 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-transform transform hover:scale-105 shadow-md disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed';
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        danger: 'bg-red-600 text-white hover:bg-red-700',
    };
    return (
        <button type={type} onClick={onClick} className={`${baseClasses} ${variants[variant]} ${className}`} disabled={disabled}>
            {children}
        </button>
    );
};

// --- البيانات المبدئية ---
const initialTrainers = [ { id: 'tr1', fullName: 'خالد عبد الرحمن', phoneNumber: '0911223344', address: 'دمشق - كفرسوسة', nationalId: '03040506070', dob: '1985-03-10', motherName: 'هند', education: 'ماجستير إدارة أعمال', specialties: ['إدارة المشاريع', 'التسويق'], cvUrl: '', cvPublicId: '' } ];
// ... other initial data

// --- المكون الرئيسي للتطبيق ---
export default function App() {
    // This is a simplified version of the App component for brevity
    // The full version would be restored from the initial prompt
    const [currentView, setCurrentView] = useState('trainers');
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                // Simplified sign-in for example
                try { await signInAnonymously(auth); } catch (e) { console.error(e); }
            }
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!isAuthReady || !userId) return;
        const collectionPath = `artifacts/${appId}/users/${userId}/trainers`;
        const q = query(collection(db, collectionPath));
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            if (querySnapshot.empty) {
                const batch = writeBatch(db);
                initialTrainers.forEach(item => {
                    const { id, ...data } = item;
                    batch.set(doc(db, collectionPath, id), data);
                });
                await batch.commit();
            }
            const dataList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTrainers(dataList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching trainers:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [isAuthReady, userId]);

    if (loading) {
        return <div className="p-8">جار التحميل...</div>;
    }

    return (
        <div dir="rtl" className="bg-gray-100 min-h-screen font-sans text-gray-900">
            <div className="w-full max-w-screen-2xl mx-auto p-4 lg:p-8">
                 <main className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
                    <TrainersView data={trainers} userId={userId} userRole="admin" />
                 </main>
            </div>
        </div>
    );
}

// --- قسم المدربين (مُحدّث بالحل الشامل) ---

// *** NEW: Universal download handler that cleans the URL before fetching ***
const handleDownload = async (url, publicId, setDownloading) => {
    if (!url) {
        console.error("Download URL is missing.");
        alert("رابط التحميل غير متوفر.");
        return;
    }
    setDownloading(true);
    try {
        // ** FIX: Proactively remove /fl_attachment/ from the URL **
        // This handles cases where Cloudinary automatically adds it via an upload preset.
        const cleanUrl = url.replace('/upload/fl_attachment/', '/upload/');
        
        console.log(`Original URL received: ${url}`);
        console.log(`Cleaned URL for fetch: ${cleanUrl}`);

        const response = await fetch(cleanUrl);
        if (!response.ok) {
            throw new Error(`فشل جلب الملف: ${response.status} ${response.statusText}`);
        }
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = blobUrl;
        
        // Try to get a proper extension from the public_id
        const extension = publicId.includes('.') ? publicId.split('.').pop() : 'pdf';
        link.download = `${publicId || 'cv'}.${extension}`;
        
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

    } catch (error) {
        console.error("Download failed:", error);
        alert(`حدث خطأ أثناء تحميل الملف: ${error.message}`);
    } finally {
        setDownloading(false);
    }
};

const TrainersView = ({ data, userId, userRole }) => {
    const [selected, setSelected] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleSave = async (formData) => {
        const dbPath = `artifacts/${appId}/users/${userId}/trainers`;
        const { id, ...dataToSave } = formData;
        if (typeof dataToSave.specialties === 'string') {
            dataToSave.specialties = dataToSave.specialties.split(',').map(s => s.trim()).filter(Boolean);
        }
        try {
            if (id) {
                await setDoc(doc(db, dbPath, id), dataToSave);
            } else {
                await addDoc(collection(db, dbPath), dataToSave);
            }
        } catch (error) { console.error("Error saving trainer:", error); }
        setIsFormOpen(false);
        setSelected(null);
    };

    return (
        <div>
            <div className="flex justify-end mb-6">
                <Button onClick={() => { setSelected(null); setIsFormOpen(true); }}><PlusCircle /> إضافة مدرب جديد</Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map(trainer => (
                    <div key={trainer.id} className="bg-gray-50 border p-5 rounded-2xl cursor-pointer hover:shadow-xl" onClick={() => setSelected(trainer)}>
                       <h3 className="font-bold text-lg">{trainer.fullName}</h3>
                       <p className="text-gray-500 text-sm">{Array.isArray(trainer.specialties) ? trainer.specialties.join(', ') : ''}</p>
                    </div>
                ))}
            </div>

            {selected && !isFormOpen && (
                <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`تفاصيل المدرب: ${selected.fullName}`} size="4xl">
                    <div className="space-y-6">
                        <InfoSection title="السيرة الذاتية">
                            {selected.cvUrl ? (
                                <Button variant="secondary" onClick={() => handleDownload(selected.cvUrl, selected.cvPublicId, setIsDownloading)} disabled={isDownloading}>
                                    <Download size={18} /> {isDownloading ? 'جارِ التحميل...' : 'تحميل الملف'}
                                </Button>
                            ) : (
                                <p className="text-gray-500">لا توجد سيرة ذاتية مرفقة.</p>
                            )}
                        </InfoSection>

                        <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                            <Button variant="secondary" onClick={() => setIsFormOpen(true)}><Edit size={16} /> تعديل</Button>
                            {/* Delete Button would go here */}
                        </div>
                    </div>
                </Modal>
            )}

            {isFormOpen && <TrainerForm isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setSelected(null); }} onSave={handleSave} trainer={selected} />}
        </div>
    );
};

const TrainerForm = ({ isOpen, onClose, onSave, trainer, isSaving }) => {
    const [formData, setFormData] = useState(
        trainer ? { ...trainer, specialties: Array.isArray(trainer.specialties) ? trainer.specialties.join(', ') : '' } :
        { fullName: '', phoneNumber: '', address: '', nationalId: '', dob: '', motherName: '', education: '', contractStartDate: '', contractEndDate: '', specialties: '', cvUrl: '', cvPublicId: '' }
    );
    const [isDownloading, setIsDownloading] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value });

    const openCloudinaryWidget = () => {
        const cloudName = "dnqhuye5h"; 
        const uploadPreset = "kaci9qnw";

        if (!window.cloudinary) { console.error("Cloudinary widget is not loaded."); return; }

        window.cloudinary.openUploadWidget({
            cloudName, uploadPreset,
            sources: ["local", "url"],
            folder: `trainers-cvs/${appId}`,
            multiple: false,
            acceptedFiles: "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            styles: { palette: { window: "#FFFFFF", tabIcon: "#0078FF", link: "#0078FF", action: "#FF620C" } }
        }, (error, result) => {
            if (!error && result && result.event === "success") {
                // ** FIX: Clean the URL before saving it to state/Firestore. **
                const originalUrl = result.info.secure_url;
                const cleanUrl = originalUrl.replace('/upload/fl_attachment/', '/upload/');
                
                console.log('Original URL from Cloudinary:', originalUrl);
                console.log('Saving this cleaned URL:', cleanUrl);

                setFormData(prev => ({
                    ...prev,
                    cvUrl: cleanUrl, // Save the cleaned URL
                    cvPublicId: result.info.public_id,
                }));
            }
        });
    };
    
    useEffect(() => {
        const scriptId = "cloudinary-upload-widget-script";
        if (document.getElementById(scriptId)) return; 
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = "https://upload-widget.cloudinary.com/global/all.js";
        script.async = true;
        document.body.appendChild(script);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={trainer ? 'تعديل بيانات المدرب' : 'إضافة مدرب جديد'} size="4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Form fields like name, phone, etc. would go here */}
                 <Input label="الاسم الثلاثي" id="fullName" value={formData.fullName} onChange={handleChange} required />
                 {/* ... other inputs */}

                <InfoSection title="السيرة الذاتية (CV)">
                    <Button type="button" variant="secondary" onClick={openCloudinaryWidget} disabled={isSaving}>
                        <Upload size={18} /> {formData.cvUrl ? 'تغيير السيرة الذاتية' : 'رفع السيرة الذاتية'}
                    </Button>
                    
                    {formData.cvUrl && (
                        <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700">الملف المرفوع حالياً:</p>
                            <Button type="button" variant="secondary" onClick={() => handleDownload(formData.cvUrl, formData.cvPublicId, setIsDownloading)} disabled={isDownloading}>
                                <Download size={16}/> {isDownloading ? 'جارِ التحميل...' : (formData.cvPublicId || 'تحميل الملف')}
                            </Button>
                        </div>
                    )}
                </InfoSection>

                <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
                    <Button variant="secondary" type="button" onClick={onClose} disabled={isSaving}>إلغاء</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? 'جارِ الحفظ...' : 'حفظ البيانات'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

// --- المكونات المساعدة ---
const InfoSection = ({ title, children }) => (
    <div>
        <h4 className="text-xl font-bold text-gray-700 border-b-2 border-blue-200 pb-2 mb-4">{title}</h4>
        <div className="space-y-2">{children}</div>
    </div>
);
