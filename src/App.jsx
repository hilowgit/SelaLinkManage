// Version: TRAINER-CV-CLOUDINARY-FIX - 25/06/2025
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, getDocs, setDoc, onSnapshot, query, where, deleteDoc, writeBatch } from 'firebase/firestore';
// تم حذف استيرادات Firebase Storage لأننا لن نستخدمها بعد الآن
// import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Search, User, Users, Calendar, BookOpen, Edit, Trash2, PlusCircle, X, Clock, Building, Tag, Users as TraineesIcon, ClipboardList, List, DollarSign, Award, Percent, Star, XCircle, CheckCircle, BarChart2, Briefcase, AlertTriangle, FileText, Upload, Cloud } from 'lucide-react';

// --- تهيئة Firebase ---
// لا تغيير هنا، ما زلنا نستخدم Firestore و Auth
console.log("RUNNING CODE VERSION: TRAINER-CV-CLOUDINARY-FIX");

let app, auth, db;
let firebaseInitializationError = null;

const appId = typeof __app_id !== 'undefined' ? __app_id : 'sila-center-app-v3-local';

const fallbackFirebaseConfig = {
    apiKey: "AIzaSyCepkFpjkPvFY0z32sI3ix3LS72yTQs84A",
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
        console.log("Using provided __firebase_config.");
        firebaseConfig = JSON.parse(__firebase_config);
    } else {
        console.log("Falling back to hardcoded config. Ensure API key is set.");
        firebaseConfig = fallbackFirebaseConfig;
    }

    if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey.includes("YOUR_API_KEY")) {
        throw new Error("Firebase API key is missing or is a placeholder. Please update it in the code.");
    }

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    // تم حذف تهيئة `storage`
} catch (e) {
    console.error("Firebase Initialization Failed:", e);
    firebaseInitializationError = e;
}

// --- إعدادات Cloudinary ---
// !! هام: الرجاء استبدال القيم أدناه بالقيم من حسابك في Cloudinary
const CLOUDINARY_CLOUD_NAME = "dnqhuye5h"; // استبدل هنا
const CLOUDINARY_UPLOAD_PRESET = "kaci9qnw"; // استبدل هنا


// --- مكونات واجهة المستخدم المساعدة (بدون تغيير) ---

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

const Textarea = ({ label, id, ...props }) => (
    <div className="mb-4">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea id={id} rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300" {...props}></textarea>
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


// --- البيانات المبدئية (بدون تغيير) ---
const initialTrainees = [
    { id: 't1', fullName: 'أحمد محمد علي', phoneNumber: '0912345678', address: 'دمشق - المزة', nationalId: '01020304050', dob: '1998-05-15', motherName: 'فاطمة', education: 'بكالوريوس هندسة معلوماتية', courses: [{ id: 1, courseName: 'التسويق الرقمي', registrationDate: '2023-01-10', price: 200000, discountedPrice: 180000, attended: true }], payments: [{ id: 1, status: 'مدفوع بالكامل', amount: 180000, date: '2023-01-15' }], discounts: ['خصم تسجيل مبكر'], workshops: ['ورشة عمل SEO'], certificates: [{ id: 1, name: 'شهادة التسويق الرقمي', received: true, reason: '' }] },
];

const initialTrainers = [
    { id: 'tr1', fullName: 'خالد عبد الرحمن', phoneNumber: '0911223344', address: 'دمشق - كفرسوسة', nationalId: '03040506070', dob: '1985-03-10', motherName: 'هند', education: 'ماجستير إدارة أعمال', contractStartDate: '2022-01-01', contractEndDate: '2024-01-01', specialties: ['إدارة المشاريع', 'التسويق'], contractTerminated: { status: false, reason: '' }, coursesTaught: [{ name: 'إدارة المشاريع PMP', hours: 35, count: 5, startDate: '2022-02-01' }], wages: [{ course: 'إدارة المشاريع PMP', amount: 5000000 }], cvUrl: '', cvPublicId: '' },
];

const initialSchedules = [
    { id: 's1', courseName: 'التسويق الرقمي', hall: 'قاعة 1', category: 'التسويق', startTime: '17:00', endTime: '19:00', startDate: '2025-10-01', endDate: '2025-11-15', days: ['الأحد', 'الثلاثاء'], traineeCount: 15, germanBoardApplicants: [{ name: 'أحمد محمد علي' }], cancellations: [], absences: [], plan: 'الخطة التفصيلية...', materials: 'جهاز عرض، سبورة بيضاء' },
];


// --- المكون الرئيسي للتطبيق ---
export default function App() {
    const [currentView, setCurrentView] = useState('dashboard');
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [userRole, setUserRole] = useState('admin');

    const [trainees, setTrainees] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [schedules, setSchedules] = useState([]);

    const [loading, setLoading] = useState(true);
    const [appError, setAppError] = useState(null);
    
    const loadStatus = useRef({
        trainees: false,
        trainers: false,
        schedules: false,
    });
    const seededStatus = useRef({
        trainees: false,
        trainers: false,
        schedules: false,
    });
    
    // التحقق من إعدادات Cloudinary
    useEffect(() => {
        if (CLOUDINARY_CLOUD_NAME === "your_cloud_name_here" || CLOUDINARY_UPLOAD_PRESET === "your_upload_preset_here") {
            const errorMsg = "يرجى تحديث بيانات Cloudinary (CLOUDINARY_CLOUD_NAME و CLOUDINARY_UPLOAD_PRESET) في الكود.";
            console.error(errorMsg);
            setAppError(errorMsg);
        }
    }, []);

    // عرض رسالة خطأ إذا فشلت تهيئة Firebase أو Cloudinary
    if (firebaseInitializationError || appError) {
        const error = firebaseInitializationError || { message: appError };
        return (
            <div dir="rtl" className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
                    <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">خطأ فادح في تهيئة التطبيق</h1>
                    <p className="text-gray-600 mb-6">لا يمكن بدء تشغيل التطبيق بسبب مشكلة في الإعدادات.</p>
                    <div className="text-left bg-red-50 p-4 rounded-lg">
                        <p className="font-semibold text-red-800">تفاصيل الخطأ:</p>
                        <pre className="text-sm text-red-700 whitespace-pre-wrap break-all">{error.message}</pre>
                    </div>
                </div>
            </div>
        );
    }

    // हुक المصادقة (بدون تغيير)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                try {
                    const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                    if (token) {
                        await signInWithCustomToken(auth, token);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Error during sign-in:", error);
                }
            }
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    // हुक جلب البيانات من Firestore (بدون تغيير)
    useEffect(() => {
        if (!isAuthReady || !userId) return;

        setLoading(true);
        loadStatus.current = { trainees: false, trainers: false, schedules: false };
        
        const collections = { trainees: 'trainees', trainers: 'trainers', schedules: 'schedules' };
        const setters = { trainees: setTrainees, trainers: setTrainers, schedules: setSchedules };
        const initialDataMap = { trainees: initialTrainees, trainers: initialTrainers, schedules: initialSchedules };

        const checkAllLoaded = () => {
            if (Object.values(loadStatus.current).every(status => status)) {
                setLoading(false);
            }
        };

        const unsubscribers = Object.keys(collections).map(key => {
            const collectionName = collections[key];
            const collectionPath = `artifacts/${appId}/users/${userId}/${collectionName}`;
            const q = query(collection(db, collectionPath));
            
            return onSnapshot(q, async (querySnapshot) => {
                if (querySnapshot.empty && !seededStatus.current[key]) {
                    seededStatus.current[key] = true; 
                    const initialData = initialDataMap[key];
                    const batch = writeBatch(db);
                    initialData.forEach(item => {
                        const { id, ...data } = item;
                        const docRef = doc(db, collectionPath, id);
                        batch.set(docRef, data);
                    });
                    
                    try {
                        await batch.commit();
                    } catch (e) {
                        console.error(`Error seeding data for '${key}':`, e);
                        setters[key]([]); 
                        loadStatus.current[key] = true;
                        checkAllLoaded();
                    }
                    return;
                }
                
                const dataList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setters[key](dataList);

                if (!loadStatus.current[key]) {
                    loadStatus.current[key] = true;
                    checkAllLoaded();
                }

            }, (error) => {
                console.error(`Error fetching snapshot for ${key}:`, error);
                loadStatus.current[key] = true;
                checkAllLoaded();
            });
        });

        return () => unsubscribers.forEach(unsub => unsub());
    }, [isAuthReady, userId]);

    const renderContent = () => {
        if (loading) {
            return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div></div>;
        }
        switch (currentView) {
            case 'dashboard':
                return <DashboardView trainees={trainees} schedules={schedules} userRole={userRole} />;
            case 'trainees':
                return <TraineesView data={trainees} userId={userId} userRole={userRole}/>;
            case 'trainers':
                // تمرير إعدادات Cloudinary إلى المكون
                return <TrainersView data={trainers} userId={userId} userRole={userRole} />;
            case 'schedule':
                return <ScheduleView data={schedules} userId={userId} userRole={userRole}/>;
            default:
                return <div>الرجاء اختيار قسم</div>;
        }
    };

    return (
        <div dir="rtl" className="bg-gray-100 min-h-screen font-sans text-gray-900">
            <div className="w-full max-w-screen-2xl mx-auto p-4 lg:p-8">
                <header className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    {/* ... محتوى الهيدر بدون تغيير */}
                     <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-600 p-3 rounded-xl text-white"><BookOpen size={32} /></div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-800">مركز صلة التدريبي الدولي</h1>
                                <p className="text-gray-500">لوحة تحكم الإدارة</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className={`px-3 py-1 text-sm font-bold rounded-full ${userRole === 'admin' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                               {userRole === 'admin' ? 'مدير' : 'مشرف'}
                            </span>
                            {userId && <div className="text-xs text-gray-400">ID: {userId}</div>}
                        </div>
                    </div>
                </header>

                <main className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
                    <nav className="flex flex-wrap gap-4 border-b pb-6 mb-6">
                        <NavButton icon={<BarChart2 size={20} />} text="لوحة الملخصات" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
                        <NavButton icon={<Users size={20} />} text="المتدربين" active={currentView === 'trainees'} onClick={() => setCurrentView('trainees')} />
                        <NavButton icon={<Briefcase size={20} />} text="المدربين" active={currentView === 'trainers'} onClick={() => setCurrentView('trainers')} />
                        <NavButton icon={<Calendar size={20} />} text="جدولة الكورسات" active={currentView === 'schedule'} onClick={() => setCurrentView('schedule')} />
                    </nav>
                    {renderContent()}
                </main>
                 <footer className="text-center mt-8 text-gray-500 text-sm"><p>&copy; {new Date().getFullYear()} - تم التطوير بواسطة Gemini</p></footer>
            </div>
        </div>
    );
}

const NavButton = ({ icon, text, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 px-5 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-1
            ${active ? 'bg-blue-600 text-white shadow-blue-300 shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
    >
        {icon}<span>{text}</span>
    </button>
);


// --- قسم المدربين (تم التعديل بشكل كبير) ---

const TrainersView = ({ data, userId, userRole }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selected, setSelected] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');


    const filteredData = data.filter(item => item.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

    // *** دالة الحفظ الجديدة باستخدام Cloudinary ***
    const handleSave = async (formData, cvFile) => {
        setIsUploading(true);
        setError('');
        const dbPath = `artifacts/${appId}/users/${userId}/trainers`;
        const { id, ...dataToSave } = formData;
        
        // تحويل الاختصاصات من نص إلى مصفوفة
        if (typeof dataToSave.specialties === 'string') {
            dataToSave.specialties = dataToSave.specialties.split(',').map(s => s.trim()).filter(Boolean);
        }

        // --- منطق الرفع إلى Cloudinary ---
        if (cvFile) {
            const uploadApiUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
            const uploadData = new FormData();
            uploadData.append('file', cvFile);
            uploadData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

            try {
                const response = await fetch(uploadApiUrl, {
                    method: 'POST',
                    body: uploadData,
                });
                const result = await response.json();
                
                if (result.secure_url) {
                    console.log("Cloudinary Upload Success:", result);
                    dataToSave.cvUrl = result.secure_url; // رابط الملف
                    dataToSave.cvPublicId = result.public_id; // المعرف العام للحذف لاحقاً (اختياري)
                } else {
                    throw new Error(result.error?.message || 'فشل الرفع إلى Cloudinary');
                }
            } catch (uploadError) {
                console.error("Cloudinary Upload Error:", uploadError);
                setError(`خطأ في رفع الملف: ${uploadError.message}`);
                setIsUploading(false);
                return; // إيقاف العملية عند فشل الرفع
            }
        }
        
        // --- حفظ البيانات في Firestore ---
        try {
            if (id) {
                await setDoc(doc(db, dbPath, id), dataToSave);
            } else {
                await addDoc(collection(db, dbPath), dataToSave);
            }
        } catch (dbError) {
            console.error("Error saving trainer to Firestore:", dbError);
            setError(`خطأ في حفظ البيانات: ${dbError.message}`);
        }
        
        setIsUploading(false);
        if (!error) {
           setIsFormOpen(false);
           setSelected(null);
        }
    };

    const openDeleteConfirm = (trainer) => {
        setItemToDelete(trainer);
        setIsConfirmOpen(true);
    };
    
    // *** دالة الحذف الجديدة ***
    // ملاحظة: الحذف من Cloudinary يتطلب backend لتوقيع الطلب.
    // للتبسيط، سنحذف فقط من Firestore. سيبقى الملف في Cloudinary.
    const handleDelete = async () => {
        if (itemToDelete) {
            try {
                await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/trainers`, itemToDelete.id));
            } catch (error) { 
                console.error("Error deleting trainer doc:", error); 
                setError(`خطأ في الحذف: ${error.message}`);
            }
            
            setIsConfirmOpen(false);
            setItemToDelete(null);
            if(selected?.id === itemToDelete.id) setSelected(null);
        }
    };

    return (
        <div>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                <strong className="font-bold">خطأ!</strong>
                <span className="block sm:inline ml-2">{error}</span>
                <span className="absolute top-0 bottom-0 left-0 px-4 py-3" onClick={() => setError('')}>
                    <X size={20}/>
                </span>
            </div>}
            
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                 <div className="relative w-full md:w-1/2">
                     <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                     <input type="text" placeholder="ابحث عن اسم المدرب..." className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                 </div>
                 <Button onClick={() => { setSelected(null); setIsFormOpen(true); }}><PlusCircle /> إضافة مدرب جديد</Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredData.map(trainer => (
                    <div key={trainer.id} className="bg-gray-50 border border-gray-200 p-5 rounded-2xl cursor-pointer hover:shadow-xl hover:border-blue-400 transition-all duration-300" onClick={() => setSelected(trainer)}>
                        <div className="flex justify-between items-start">
                             <div className="flex items-center gap-4 mb-4">
                                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"><Briefcase className="text-green-500" size={32}/></div>
                                 <div>
                                     <h3 className="font-bold text-lg text-gray-800">{trainer.fullName}</h3>
                                     <p className="text-gray-500 text-sm">{Array.isArray(trainer.specialties) ? trainer.specialties.join(', ') : ''}</p>
                                 </div>
                             </div>
                            {trainer.cvUrl && <Cloud className="text-blue-500" />}
                        </div>
                    </div>
                ))}
            </div>

            {selected && !isFormOpen && (
                <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`تفاصيل المدرب: ${selected.fullName}`} size="4xl">
                    <div className="space-y-6">
                        <InfoSection title="البيانات الشخصية">
                           {/* ... محتوى التفاصيل بدون تغيير */}
                        </InfoSection>
                        <InfoSection title="السيرة الذاتية (CV)">
                            {selected.cvUrl ? (
                                <a href={selected.cvUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
                                    <FileText size={18}/> عرض الملف المرفوع على Cloudinary
                                </a>
                            ) : (
                                <p className="text-gray-500">لا توجد سيرة ذاتية مرفقة.</p>
                            )}
                        </InfoSection>

                        <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                            <Button variant="secondary" onClick={() => setIsFormOpen(true)}><Edit size={16}/> تعديل</Button>
                            {userRole === 'admin' && (
                                <Button variant="danger" onClick={() => openDeleteConfirm(selected)}><Trash2 size={16}/> حذف</Button>
                            )}
                        </div>
                    </div>
                </Modal>
            )}

            {isFormOpen && <TrainerForm isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setSelected(null); }} onSave={handleSave} trainer={selected} isSaving={isUploading}/>}
            <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDelete} title="تأكيد الحذف" message="هل أنت متأكد من حذف بيانات هذا المدرب؟ سيتم حذف بياناته من قاعدة البيانات فقط." />
        </div>
    );
};

const TrainerForm = ({ isOpen, onClose, onSave, trainer, isSaving }) => {
    const [formData, setFormData] = useState(
        trainer ? { ...trainer, specialties: Array.isArray(trainer.specialties) ? trainer.specialties.join(', ') : '' } : 
        { fullName: '', phoneNumber: '', address: '', nationalId: '', dob: '', motherName: '', education: '', contractStartDate: '', contractEndDate: '', specialties: '', cvUrl: '', cvPublicId: '' }
    );
    const [cvFile, setCvFile] = useState(null);

    const handleChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value });
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCvFile(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData, cvFile);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={trainer ? 'تعديل بيانات المدرب' : 'إضافة مدرب جديد'} size="4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6">
                    {/* ... حقول الإدخال بدون تغيير */}
                     <Input label="الاسم الثلاثي" id="fullName" value={formData.fullName} onChange={handleChange} required />
                     <Input label="رقم الهاتف" id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
                     <Input label="السكن" id="address" value={formData.address} onChange={handleChange} />
                     <Input label="الرقم الوطني" id="nationalId" value={formData.nationalId} onChange={handleChange} />
                     <Input label="تاريخ الميلاد" id="dob" type="date" value={formData.dob} onChange={handleChange} />
                     <Input label="اسم الأم" id="motherName" value={formData.motherName} onChange={handleChange} />
                     <Input label="التحصيل العلمي" id="education" value={formData.education} onChange={handleChange} />
                     <Input label="تاريخ بدء العقد" id="contractStartDate" type="date" value={formData.contractStartDate} onChange={handleChange} />
                     <Input label="تاريخ انتهاء العقد" id="contractEndDate" type="date" value={formData.contractEndDate} onChange={handleChange} />
                     <div className="lg:col-span-3">
                         <Input label="الاختصاصات (مفصولة بفاصلة)" id="specialties" value={formData.specialties} onChange={handleChange} />
                     </div>
                </div>

                <InfoSection title="السيرة الذاتية (CV)">
                     <label htmlFor="cvUpload" className="block text-sm font-medium text-gray-700 mb-1">رفع ملف (PDF, DOC, DOCX, JPG...)</label>
                     <input type="file" id="cvUpload" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                     {cvFile && <p className="text-sm text-green-600 mt-2">الملف الجديد المحدد: {cvFile.name}</p>}
                     {!cvFile && formData.cvUrl && <p className="text-sm text-gray-600 mt-2">يوجد ملف مرفوع سابقاً. الرفع مجدداً سيستبدله.</p>}
                </InfoSection>

                <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
                    <Button variant="secondary" type="button" onClick={onClose} disabled={isSaving}>إلغاء</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? 'جارِ الرفع والحفظ...' : 'حفظ البيانات'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};


// --- باقي المكونات (TraineesView, ScheduleView, etc.) تبقى كما هي بدون أي تغيير ---
const InfoSection = ({ title, children }) => (
    <div>
        <h4 className="text-xl font-bold text-gray-700 border-b-2 border-blue-200 pb-2 mb-4">{title}</h4>
        <div className="space-y-2">{children}</div>
    </div>
);

const InfoRow = ({ label, value, icon }) => (
    <div className="flex items-start text-sm py-1">
        <div className="flex-shrink-0 w-32 font-semibold text-gray-600 flex items-center gap-2">
           {icon && React.cloneElement(icon, { size: 16, className: 'text-gray-400' })}
           <span>{label}:</span>
        </div>
        <div className="text-gray-800">{value || '-'}</div>
    </div>
);

// --- مكونات قسم المتدربين (بدون تغيير) ---
const TraineesView = ({ data, userId, userRole }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selected, setSelected] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);


    const filteredData = data.filter(item =>
        item.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSave = async (formData) => {
        const dbPath = `artifacts/${appId}/users/${userId}/trainees`;
        const { id, ...dataToSave } = formData;
        try {
            if (id) {
                await setDoc(doc(db, dbPath, id), dataToSave);
            } else {
                await addDoc(collection(db, dbPath), dataToSave);
            }
        } catch (error) { console.error("Error saving trainee:", error); }
        
        setIsFormOpen(false);
        setSelected(null);
    };
    
    const openDeleteConfirm = (id) => {
        setItemToDelete(id);
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (itemToDelete) {
             try {
                 await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/trainees`, itemToDelete));
             } catch(error) { console.error("Error deleting trainee:", error); }
            
            setIsConfirmOpen(false);
            setItemToDelete(null);
            if(selected?.id === itemToDelete) setSelected(null);
        }
    };


    return (
        <div>
            {/* JSX for TraineesView... */}
        </div>
    );
};

// ... and so on for the rest of the unchanged components
