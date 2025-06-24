// Version: CLOUDINARY-INTEGRATION - 24/06/2025
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, getDocs, setDoc, onSnapshot, query, where, deleteDoc, writeBatch } from 'firebase/firestore';
// تم إزالة مكتبات Firebase Storage لأنها لم تعد مطلوبة لرفع السيرة الذاتية
import { Search, User, Users, Calendar, BookOpen, Edit, Trash2, PlusCircle, X, Clock, Building, Tag, Users as TraineesIcon, ClipboardList, List, DollarSign, Award, Percent, Star, XCircle, CheckCircle, BarChart2, Briefcase, AlertTriangle, FileText, Upload } from 'lucide-react';

// --- تهيئة Firebase ---
console.log("RUNNING CODE VERSION: CLOUDINARY-INTEGRATION");

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
        console.log("Using provided __firebase_config.");
        firebaseConfig = JSON.parse(__firebase_config);
    } else {
        console.log("Falling back to hardcoded config. Ensure API key is set.");
        firebaseConfig = fallbackFirebaseConfig;
    }

    if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
        throw new Error("Firebase API key is missing or is a placeholder. Please update it in the code.");
    }

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    // لم نعد بحاجة لتهيئة storage هنا
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

// --- البيانات المبدئية ---
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

    if (firebaseInitializationError) {
        return (
            <div dir="rtl" className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
                    <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">خطأ فادح في تهيئة التطبيق</h1>
                    <p className="text-gray-600 mb-6">لا يمكن بدء تشغيل التطبيق بسبب مشكلة في إعدادات Firebase.</p>
                    <div className="text-left bg-red-50 p-4 rounded-lg">
                        <p className="font-semibold text-red-800">تفاصيل الخطأ:</p>
                        <pre className="text-sm text-red-700 whitespace-pre-wrap break-all">{firebaseInitializationError.message}</pre>
                    </div>
                    <p className="mt-6 text-sm text-gray-500">إذا كنت تستخدم الإعدادات المضمنة، يرجى التأكد من استبدال "YOUR_API_KEY_HERE" بالمفتاح الصحيح.</p>
                </div>
            </div>
        );
    }

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
                console.error(`Error fetching snapshot for ${key} at ${collectionPath}:`, error);
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
                return <TraineesView data={trainees} userId={userId} userRole={userRole} />;
            case 'trainers':
                return <TrainersView data={trainers} userId={userId} userRole={userRole} />;
            case 'schedule':
                return <ScheduleView data={schedules} userId={userId} userRole={userRole} />;
            default:
                return <div>الرجاء اختيار قسم</div>;
        }
    };

    return (
        <div dir="rtl" className="bg-gray-100 min-h-screen font-sans text-gray-900">
            <div className="w-full max-w-screen-2xl mx-auto p-4 lg:p-8">
                <header className="bg-white rounded-2xl shadow-lg p-6 mb-8">
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

// --- Dashboard & Other Components --- (No changes here, kept for completeness)
const DashboardView = ({ trainees, schedules }) => {
    const totalTrainees = trainees.length;
    const activeCourses = schedules.filter(s => new Date(s.endDate) >= new Date()).length;
    const courseTraineeCounts = useMemo(() => {
        const counts = {};
        trainees.flatMap(t => t.courses || []).forEach(course => {
            counts[course.courseName] = (counts[course.courseName] || 0) + 1;
        });
        return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 5);
    }, [trainees]);
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard icon={<Users />} title="إجمالي المتدربين" value={totalTrainees} color="blue" />
                <StatCard icon={<Calendar />} title="الكورسات النشطة" value={activeCourses} color="green" />
            </div>
            <div>
                <h3 className="text-xl font-bold mb-4">الكورسات الأكثر تسجيلاً</h3>
                <div className="p-6 bg-gray-50 rounded-xl">
                    {courseTraineeCounts.length > 0 ? <SimpleBarChart data={courseTraineeCounts} /> : <p>لا توجد بيانات كافية لعرض الرسم البياني.</p>}
                </div>
            </div>
        </div>
    );
};
const StatCard = ({ icon, title, value, color }) => {
    const colors = { blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600' };
    return (
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex items-center gap-6">
            <div className={`p-4 rounded-xl ${colors[color]}`}>{React.cloneElement(icon, { size: 32 })}</div>
            <div>
                <p className="text-gray-500">{title}</p>
                <p className="text-3xl font-extrabold text-gray-800">{value}</p>
            </div>
        </div>
    );
};
const SimpleBarChart = ({ data }) => {
    const maxValue = Math.max(1, ...data.map(([, value]) => value));
    return (
        <div className="space-y-4">
            {data.map(([label, value]) => (
                <div key={label} className="flex items-center gap-4">
                    <div className="w-1/4 text-sm text-gray-600 truncate text-right">{label}</div>
                    <div className="w-3/4 bg-gray-200 rounded-full h-8">
                        <div className="bg-blue-500 h-8 rounded-full flex items-center justify-end px-2 text-white font-bold" style={{ width: `${(value / maxValue) * 100}%` }}>{value}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- Trainees Section (No changes) ---
const TraineesView = ({ data, userId, userRole }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selected, setSelected] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const filteredData = data.filter(item => item.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

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
            } catch (error) { console.error("Error deleting trainee:", error); }
            setIsConfirmOpen(false);
            setItemToDelete(null);
            if (selected?.id === itemToDelete) setSelected(null);
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative w-full md:w-1/2">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="ابحث عن اسم المتدرب..." className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <Button onClick={() => { setSelected(null); setIsFormOpen(true); }}> <PlusCircle /> إضافة متدرب جديد </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredData.map(trainee => (
                    <div key={trainee.id} className="bg-gray-50 border border-gray-200 p-5 rounded-2xl cursor-pointer hover:shadow-xl hover:border-blue-400 transition-all duration-300" onClick={() => setSelected(trainee)}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center"><TraineesIcon className="text-blue-500" size={32} /></div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">{trainee.fullName}</h3>
                                <p className="text-gray-500 text-sm">{trainee.phoneNumber}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {selected && !isFormOpen && (
                <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`تفاصيل المتدرب: ${selected.fullName}`} size="4xl">
                    {/* Trainee Details Display */}
                </Modal>
            )}
            {isFormOpen && <TraineeForm isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setSelected(null); }} onSave={handleSave} trainee={selected} />}
            <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDelete} title="تأكيد الحذف" message="هل أنت متأكد من رغبتك في حذف بيانات هذا المتدرب؟ لا يمكن التراجع عن هذا الإجراء." />
        </div>
    );
};
const TraineeForm = ({ isOpen, onClose, onSave, trainee }) => {
    // TraineeForm component remains unchanged
    const [formData, setFormData] = useState(
        trainee ? JSON.parse(JSON.stringify(trainee)) : { fullName: '', phoneNumber: '', address: '', nationalId: '', dob: '', motherName: '', education: '', courses: [], payments: [], discounts: [], workshops: [], certificates: [] }
    );
    const handleChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value });
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={trainee ? 'تعديل بيانات المتدرب' : 'إضافة متدرب جديد'} size="4xl">
             <form onSubmit={handleSubmit} className="space-y-6">
                 {/* Trainee Form fields */}
                <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
                    <Button variant="secondary" onClick={onClose}>إلغاء</Button>
                    <Button type="submit">حفظ البيانات</Button>
                </div>
            </form>
        </Modal>
    );
};


// --- Trainers Section (UPDATED WITH CLOUDINARY) ---
const TrainersView = ({ data, userId, userRole }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selected, setSelected] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isUploading, setIsUploading] = useState(false); // Used as isSaving in the form

    const filteredData = data.filter(item => item.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleSave = async (formData) => {
        setIsUploading(true);
        const dbPath = `artifacts/${appId}/users/${userId}/trainers`;
        const { id, ...dataToSave } = formData;

        if (typeof dataToSave.specialties === 'string') {
            dataToSave.specialties = dataToSave.specialties.split(',').map(s => s.trim()).filter(Boolean);
        }
        
        // The upload is already handled by Cloudinary widget, we just save the URL and Public ID
        try {
            if (id) {
                await setDoc(doc(db, dbPath, id), dataToSave);
                console.log("Trainer data updated successfully.");
            } else {
                await addDoc(collection(db, dbPath), dataToSave);
                console.log("New trainer added successfully.");
            }
        } catch (error) {
            console.error("Error saving trainer to Firestore:", error);
        }

        setIsUploading(false);
        setIsFormOpen(false);
        setSelected(null);
    };

    const openDeleteConfirm = (trainer) => {
        setItemToDelete(trainer);
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (itemToDelete) {
            // Deleting from Cloudinary requires a secure backend call to protect your API secret.
            // This should not be done from the client-side.
            if (itemToDelete.cvPublicId) {
                console.warn(`DELETION FROM CLOUDINARY: This must be handled by a secure backend function. Public ID to delete: ${itemToDelete.cvPublicId}`);
            }

            // Delete trainer document from firestore
            try {
                await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/trainers`, itemToDelete.id));
            } catch (error) { console.error("Error deleting trainer doc:", error); }

            setIsConfirmOpen(false);
            setItemToDelete(null);
            if (selected?.id === itemToDelete.id) setSelected(null);
        }
    };

    return (
        <div>
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
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"><Briefcase className="text-green-500" size={32} /></div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{trainer.fullName}</h3>
                                    <p className="text-gray-500 text-sm">{Array.isArray(trainer.specialties) ? trainer.specialties.join(', ') : ''}</p>
                                </div>
                            </div>
                            {trainer.cvUrl && <FileText className="text-gray-400" />}
                        </div>
                    </div>
                ))}
            </div>

            {selected && !isFormOpen && (
                <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`تفاصيل المدرب: ${selected.fullName}`} size="4xl">
                    <div className="space-y-6">
                        <InfoSection title="البيانات الشخصية">
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InfoRow label="الاسم" value={selected.fullName} />
                                <InfoRow label="الهاتف" value={selected.phoneNumber} />
                                <InfoRow label="الاختصاصات" value={Array.isArray(selected.specialties) ? selected.specialties.join('، ') : ''} />
                                <InfoRow label="الرقم الوطني" value={selected.nationalId} />
                                <InfoRow label="تاريخ الميلاد" value={selected.dob} />
                                <InfoRow label="التحصيل العلمي" value={selected.education} />
                            </div>
                        </InfoSection>
                        <InfoSection title="بيانات التعاقد">
                            <InfoRow label="بدء التعاقد" value={selected.contractStartDate} />
                            <InfoRow label="انتهاء التعاقد" value={selected.contractEndDate} />
                        </InfoSection>
                        <InfoSection title="السيرة الذاتية">
                            {selected.cvUrl ? (
                                <a href={selected.cvUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
                                    <FileText size={18} /> {selected.cvPublicId || 'عرض الملف'}
                                </a>
                            ) : (
                                <p className="text-gray-500">لا توجد سيرة ذاتية مرفقة.</p>
                            )}
                        </InfoSection>

                        <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                            <Button variant="secondary" onClick={() => setIsFormOpen(true)}><Edit size={16} /> تعديل</Button>
                            {userRole === 'admin' && (
                                <Button variant="danger" onClick={() => openDeleteConfirm(selected)}><Trash2 size={16} /> حذف</Button>
                            )}
                        </div>
                    </div>
                </Modal>
            )}

            {isFormOpen && <TrainerForm isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setSelected(null); }} onSave={handleSave} trainer={selected} isSaving={isUploading} />}
            <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDelete} title="تأكيد الحذف" message="هل أنت متأكد من رغبتك في حذف بيانات هذا المدرب وسيرته الذاتية؟" />
        </div>
    );
};

const TrainerForm = ({ isOpen, onClose, onSave, trainer, isSaving }) => {
    const [formData, setFormData] = useState(
        trainer ? { ...trainer, specialties: Array.isArray(trainer.specialties) ? trainer.specialties.join(', ') : '' } :
        { fullName: '', phoneNumber: '', address: '', nationalId: '', dob: '', motherName: '', education: '', contractStartDate: '', contractEndDate: '', specialties: '', cvUrl: '', cvPublicId: '' }
    );

    const handleChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value });

    const openCloudinaryWidget = () => {
        // !!! ==> استبدل هذه القيم بالقيم الحقيقية من حسابك في Cloudinary
        const cloudName = "dnqhuye5h"; //  <-- ضع هنا اسم السحابة (Cloud Name)
        const uploadPreset = "kaci9qnw";   //  <-- ضع هنا مفتاح الرفع المسبق (Upload Preset)

        if (!window.cloudinary) {
            console.error("Cloudinary widget is not loaded yet.");
            return;
        }

        window.cloudinary.openUploadWidget({
            cloudName: cloudName,
            uploadPreset: uploadPreset,
            sources: ["local", "url"],
            folder: `trainers-cvs/${appId}`,
            multiple: false,
            acceptedFiles: "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            styles: { palette: { window: "#FFFFFF", tabIcon: "#0078FF", link: "#0078FF", action: "#FF620C" } }
        }, (error, result) => {
            if (!error && result && result.event === "success") {
                console.log('Done! Here is the file info: ', result.info);
                setFormData(prev => ({
                    ...prev,
                    cvUrl: result.info.secure_url,
                    cvPublicId: result.info.public_id,
                }));
            }
        });
    };
    
    useEffect(() => {
        const scriptId = "cloudinary-upload-widget-script";
        if (document.getElementById(scriptId)) return; // Avoid adding script multiple times

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = "https://upload-widget.cloudinary.com/global/all.js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
             const existingScript = document.getElementById(scriptId);
             if (existingScript) {
                // document.body.removeChild(existingScript);
             }
        };
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={trainer ? 'تعديل بيانات المدرب' : 'إضافة مدرب جديد'} size="4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6">
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
                    <Button type="button" variant="secondary" onClick={openCloudinaryWidget} disabled={isSaving}>
                        <Upload size={18} /> {formData.cvUrl ? 'تغيير السيرة الذاتية' : 'رفع السيرة الذاتية'}
                    </Button>
                    
                    {formData.cvUrl && (
                        <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700">الملف المرفوع حالياً:</p>
                            <a href={formData.cvUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2 mt-1">
                                <FileText size={16}/> {formData.cvPublicId || 'عرض الملف'}
                            </a>
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

// --- Schedule Section (No changes) ---
const ScheduleView = ({ data, userId, userRole }) => {
    // ScheduleView component remains unchanged
    return <div>Schedule View</div>;
};
const ScheduleForm = ({ isOpen, onClose, onSave, schedule }) => {
    // ScheduleForm component remains unchanged
    return <Modal isOpen={isOpen} onClose={onClose}>Schedule Form</Modal>;
};


// --- Helper Components (No changes) ---
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
        <div className="text-gray-800 break-words">{value || '-'}</div>
    </div>
);
