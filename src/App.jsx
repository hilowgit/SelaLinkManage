import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, getDocs, setDoc, onSnapshot, query, where, deleteDoc, writeBatch } from 'firebase/firestore';
import { Search, User, Users, Calendar, BookOpen, Edit, Trash2, PlusCircle, X, Clock, Building, Tag, Users as TraineesIcon, ClipboardList, List, DollarSign, Award, Percent, Star, XCircle, CheckCircle, BarChart2, Briefcase, AlertTriangle } from 'lucide-react';

// --- تهيئة Firebase ---
// تم تثبيت الإعدادات الصحيحة مباشرةً لضمان عملها على Netlify
const firebaseConfig = {
    apiKey: "AIzaSyDNpZkYVtwQIhT4oI1sP9z6fM1i3Jc8wXk", // تم استخدام مفتاح API جديد
    authDomain: "selalinkm.firebaseapp.com",
    projectId: "selalinkm",
    storageBucket: "selalinkm.appspot.com",
    messagingSenderId: "630184793476",
    appId: "1:630184793476:web:c245aff861f8204990c311",
    measurementId: "G-ZHTF5H94H3"
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'sila-center-app-v3-local';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


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
    { id: 'tr1', fullName: 'خالد عبد الرحمن', phoneNumber: '0911223344', address: 'دمشق - كفرسوسة', nationalId: '03040506070', dob: '1985-03-10', motherName: 'هند', education: 'ماجستير إدارة أعمال', contractStartDate: '2022-01-01', contractEndDate: '2024-01-01', specialties: ['إدارة المشاريع', 'التسويق'], contractTerminated: { status: false, reason: '' }, coursesTaught: [{ name: 'إدارة المشاريع PMP', hours: 35, count: 5, startDate: '2022-02-01' }], wages: [{ course: 'إدارة المشاريع PMP', amount: 5000000 }] },
];

const initialSchedules = [
    { id: 's1', courseName: 'التسويق الرقمي', hall: 'قاعة 1', category: 'التسويق', startTime: '17:00', endTime: '19:00', startDate: '2025-10-01', endDate: '2025-11-15', days: ['الأحد', 'الثلاثاء'], traineeCount: 15, germanBoardApplicants: [{ name: 'أحمد محمد علي' }], cancellations: [], absences: [], plan: 'الخطة التفصيلية...', materials: 'جهاز عرض، سبورة بيضاء' },
];


// --- المكون الرئيسي للتطبيق ---
export default function App() {
    const [currentView, setCurrentView] = useState('dashboard');
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [userRole, setUserRole] = useState('admin'); // 'admin' or 'supervisor'

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


    useEffect(() => {
        console.log("Setting up auth state listener...");
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("User is signed in with UID:", user.uid);
                setUserId(user.uid);
            } else {
                 console.log("User is not signed in. Attempting custom/anonymous sign in.");
                 try {
                     const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                     if(token) {
                        console.log("Attempting sign in with custom token.");
                        await signInWithCustomToken(auth, token);
                     } else {
                        console.log("Attempting anonymous sign in.");
                        await signInAnonymously(auth);
                     }
                 } catch (error) { 
                    console.error("Error during sign-in:", error); 
                 }
            }
            console.log("Auth check complete. Setting isAuthReady to true.");
            setIsAuthReady(true);
        });
        return () => {
            console.log("Cleaning up auth state listener.");
            unsubscribe();
        }
    }, []);

    // *** useEffect المٌحسّن لجلب البيانات ***
    useEffect(() => {
        if (!isAuthReady || !userId) {
            console.log("Data fetching skipped: Auth not ready or no user ID.", { isAuthReady, userId });
            return;
        }

        console.log(`Starting data fetch for user ID: ${userId}`);
        setLoading(true);
        
        loadStatus.current = { trainees: false, trainers: false, schedules: false };
        
        const collections = { trainees: 'trainees', trainers: 'trainers', schedules: 'schedules' };
        const setters = { trainees: setTrainees, trainers: setTrainers, schedules: setSchedules };
        const initialDataMap = { trainees: initialTrainees, trainers: initialTrainers, schedules: initialSchedules };

        const checkAllLoaded = () => {
            if (Object.values(loadStatus.current).every(status => status)) {
                console.log("All collections have reported their status. Setting loading to false.");
                setLoading(false);
            }
        };

        const unsubscribers = Object.keys(collections).map(key => {
            const collectionName = collections[key];
            const collectionPath = `artifacts/${appId}/users/${userId}/${collectionName}`;
            const q = query(collection(db, collectionPath));
            
            console.log(`Attaching onSnapshot listener to: ${collectionPath}`);

            return onSnapshot(q, async (querySnapshot) => {
                console.log(`Snapshot received for '${key}'. Empty: ${querySnapshot.empty}`);

                if (querySnapshot.empty && !seededStatus.current[key]) {
                    console.log(`Collection '${key}' is empty, attempting to seed initial data.`);
                    seededStatus.current[key] = true; // Mark as "attempted to seed"
                    const initialData = initialDataMap[key];
                    const batch = writeBatch(db);
                    initialData.forEach(item => {
                        const { id, ...data } = item;
                        const docRef = doc(db, collectionPath, id);
                        batch.set(docRef, data);
                    });
                    
                    try {
                        await batch.commit();
                        console.log(`Successfully seeded '${key}' with ${initialData.length} documents.`);
                        // The onSnapshot listener will fire again automatically with the new data.
                        // We don't need to manually set state here.
                    } catch (e) {
                        console.error(`Error seeding data for '${key}':`, e);
                        // If seeding fails, we still mark it as "loaded" to prevent the app from hanging.
                        setters[key]([]); // Set to empty array on failure
                        loadStatus.current[key] = true;
                        checkAllLoaded();
                    }
                    return;
                }
                
                const dataList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setters[key](dataList);
                console.log(`Updated state for '${key}' with ${dataList.length} documents.`);

                if (!loadStatus.current[key]) {
                    loadStatus.current[key] = true;
                    checkAllLoaded();
                }

            }, (error) => {
                console.error(`Error fetching snapshot for ${key} at ${collectionPath}:`, error);
                // On error (e.g., permission denied), mark as loaded to avoid hanging
                loadStatus.current[key] = true;
                checkAllLoaded();
            });
        });

        return () => {
            console.log("Cleaning up all Firestore listeners.");
            unsubscribers.forEach(unsub => unsub());
        };
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
                return <TrainersView data={trainers} userId={userId} userRole={userRole}/>;
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

// --- باقي المكونات تبقى كما هي ---
// --- لوحة الملخصات ---
const DashboardView = ({ trainees, schedules, userRole }) => {
    const totalTrainees = trainees.length;
    const activeCourses = schedules.filter(s => new Date(s.endDate) >= new Date()).length;
    
    const totalRevenue = useMemo(() => 
        trainees.flatMap(t => t.courses || []).reduce((acc, course) => acc + (course.discountedPrice || 0), 0)
    , [trainees]);

    const courseTraineeCounts = useMemo(() => {
        const counts = {};
        trainees.flatMap(t => t.courses || []).forEach(course => {
            counts[course.courseName] = (counts[course.courseName] || 0) + 1;
        });
        return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 5);
    }, [trainees]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard icon={<Users />} title="إجمالي المتدربين" value={totalTrainees} color="blue" />
                <StatCard icon={<Calendar />} title="الكورسات النشطة" value={activeCourses} color="green" />
                {userRole === 'admin' && (
                    <StatCard icon={<DollarSign />} title="إجمالي الإيرادات" value={`${totalRevenue.toLocaleString()} ل.س`} color="yellow" />
                )}
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
    const colors = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        yellow: 'bg-yellow-100 text-yellow-600',
    };
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
                        <div
                            className="bg-blue-500 h-8 rounded-full flex items-center justify-end px-2 text-white font-bold"
                            style={{ width: `${(value / maxValue) * 100}%` }}
                        >
                            {value}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};


// --- مكونات قسم المتدربين ---
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
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center"><TraineesIcon className="text-blue-500" size={32}/></div>
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
                    <div className="space-y-6">
                        <InfoSection title="البيانات الشخصية">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InfoRow label="الاسم الثلاثي" value={selected.fullName} />
                                <InfoRow label="رقم الهاتف" value={selected.phoneNumber} />
                                <InfoRow label="السكن" value={selected.address} />
                                <InfoRow label="الرقم الوطني" value={selected.nationalId} />
                                <InfoRow label="تاريخ الميلاد" value={selected.dob} />
                                <InfoRow label="اسم الأم" value={selected.motherName} />
                                <InfoRow label="التحصيل العلمي" value={selected.education} />
                            </div>
                        </InfoSection>

                        <InfoSection title="الكورسات المسجلة">
                            {selected.courses?.map((c, i) => (
                                <div key={i} className="p-3 bg-gray-100 rounded-lg mb-2">
                                    <p className="font-bold">{c.courseName}</p>
                                    <InfoRow label="تاريخ التسجيل" value={c.registrationDate} />
                                    <InfoRow label="السعر" value={`${c.price?.toLocaleString() || 0} ل.س`} />
                                    <InfoRow label="بعد الحسم" value={`${c.discountedPrice?.toLocaleString() || 0} ل.س`} />
                                </div>
                            ))}
                        </InfoSection>
                         <InfoSection title="الشهادات والورشات">
                            {selected.certificates?.map((c, i) => (
                                <div key={i} className="p-3 bg-gray-100 rounded-lg mb-2">
                                     <InfoRow label="شهادة" value={c.name} />
                                     <InfoRow label="الحالة" value={c.received ? 'تم الاستلام' : `لم تستلم (${c.reason || 'لا يوجد سبب'})`} />
                                </div>
                            ))}
                             <InfoRow label="ورشات/إيفنتات" value={selected.workshops?.join(', ') || 'لا يوجد'} icon={<Star/>}/>
                        </InfoSection>

                        <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                            <Button variant="secondary" onClick={() => { setIsFormOpen(true); }}> <Edit size={16}/> تعديل </Button>
                            {userRole === 'admin' && (
                                <Button variant="danger" onClick={() => openDeleteConfirm(selected.id)}> <Trash2 size={16}/> حذف </Button>
                            )}
                        </div>
                    </div>
                </Modal>
            )}

            {isFormOpen && <TraineeForm isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setSelected(null); }} onSave={handleSave} trainee={selected} />}
            <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDelete} title="تأكيد الحذف" message="هل أنت متأكد من رغبتك في حذف بيانات هذا المتدرب؟ لا يمكن التراجع عن هذا الإجراء." />
        </div>
    );
};

const TraineeForm = ({ isOpen, onClose, onSave, trainee }) => {
    const [formData, setFormData] = useState(
        trainee ? JSON.parse(JSON.stringify(trainee)) : { fullName: '', phoneNumber: '', address: '', nationalId: '', dob: '', motherName: '', education: '', courses: [], payments: [], discounts: [], workshops: [], certificates: [] }
    );

    const handleChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value });

    const handleNestedChange = (collection, index, event) => {
        const { id, value, type, checked } = event.target;
        const newCollection = [...formData[collection]];
        newCollection[index][id] = type === 'checkbox' ? checked : value;
        setFormData({ ...formData, [collection]: newCollection });
    };

    const addNestedItem = (collection, newItem) => setFormData({ ...formData, [collection]: [...(formData[collection] || []), newItem] });

    const removeNestedItem = (collection, index) => {
        const newCollection = [...formData[collection]];
        newCollection.splice(index, 1);
        setFormData({ ...formData, [collection]: newCollection });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={trainee ? 'تعديل بيانات المتدرب' : 'إضافة متدرب جديد'} size="4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <InfoSection title="البيانات الشخصية">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6">
                        <Input label="الاسم الثلاثي" id="fullName" value={formData.fullName} onChange={handleChange} required />
                        <Input label="رقم الهاتف" id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
                        <Input label="السكن" id="address" value={formData.address} onChange={handleChange} />
                        <Input label="الرقم الوطني" id="nationalId" value={formData.nationalId} onChange={handleChange} />
                        <Input label="تاريخ الميلاد" id="dob" type="date" value={formData.dob} onChange={handleChange} />
                        <Input label="اسم الأم" id="motherName" value={formData.motherName} onChange={handleChange} />
                        <Input label="التحصيل العلمي" id="education" value={formData.education} onChange={handleChange} />
                    </div>
                </InfoSection>

                <InfoSection title="الكورسات">
                    <Button variant="secondary" onClick={() => addNestedItem('courses', {id: Date.now(), courseName: '', registrationDate: '', price: '', discountedPrice: ''})}>
                        <PlusCircle size={16}/> إضافة كورس
                    </Button>
                    <div className="space-y-2 mt-2">
                        {formData.courses?.map((course, index) => (
                            <div key={course.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-gray-50 p-4 rounded-lg items-end">
                                <div className="md:col-span-2"><Input label="اسم الكورس" id="courseName" value={course.courseName} onChange={(e) => handleNestedChange('courses', index, e)} /></div>
                                <div><Input label="تاريخ التسجيل" id="registrationDate" type="date" value={course.registrationDate} onChange={(e) => handleNestedChange('courses', index, e)} /></div>
                                <div><Input label="السعر" id="price" type="number" value={course.price} onChange={(e) => handleNestedChange('courses', index, e)} /></div>
                                <Button variant="danger" onClick={() => removeNestedItem('courses', index)}> <Trash2 size={16}/> </Button>
                            </div>
                        ))}
                    </div>
                </InfoSection>
                
                <InfoSection title="الشهادات">
                    <Button variant="secondary" onClick={() => addNestedItem('certificates', {id: Date.now(), name: '', received: false, reason: ''})}>
                        <PlusCircle size={16}/> إضافة شهادة
                    </Button>
                    <div className="space-y-2 mt-2">
                        {formData.certificates?.map((cert, index) => (
                            <div key={cert.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg items-center">
                                <div className="md:col-span-2"><Input label="اسم الشهادة" id="name" value={cert.name} onChange={(e) => handleNestedChange('certificates', index, e)} /></div>
                                <div><Input label="سبب عدم الاستلام" id="reason" value={cert.reason} onChange={(e) => handleNestedChange('certificates', index, e)} disabled={cert.received} /></div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 pt-5"><input type="checkbox" id="received" checked={cert.received} onChange={(e) => handleNestedChange('certificates', index, e)} /> استلمت</label>
                                    <Button variant="danger" onClick={() => removeNestedItem('certificates', index)}> <Trash2 size={16}/> </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </InfoSection>

                <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
                    <Button variant="secondary" onClick={onClose}>إلغاء</Button>
                    <Button type="submit">حفظ البيانات</Button>
                </div>
            </form>
        </Modal>
    );
};


// --- مكونات قسم المدربين ---
const TrainersView = ({ data, userId, userRole }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selected, setSelected] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const filteredData = data.filter(item => item.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleSave = async (formData) => {
        const dbPath = `artifacts/${appId}/users/${userId}/trainers`;
        const { id, ...dataToSave } = formData;
        // Convert specialties string to array
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

    const openDeleteConfirm = (id) => {
        setItemToDelete(id);
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (itemToDelete) {
            try {
                await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/trainers`, itemToDelete));
            } catch (error) { console.error("Error deleting trainer:", error); }
            setIsConfirmOpen(false);
            setItemToDelete(null);
            if(selected?.id === itemToDelete) setSelected(null);
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
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"><Briefcase className="text-green-500" size={32}/></div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">{trainer.fullName}</h3>
                                <p className="text-gray-500 text-sm">{Array.isArray(trainer.specialties) ? trainer.specialties.join(', ') : ''}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selected && !isFormOpen && (
                <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`تفاصيل المدرب: ${selected.fullName}`} size="4xl">
                    <div className="space-y-6">
                        <InfoSection title="البيانات الشخصية">
                            <InfoRow label="الاسم" value={selected.fullName} />
                            <InfoRow label="الهاتف" value={selected.phoneNumber} />
                            <InfoRow label="الاختصاصات" value={Array.isArray(selected.specialties) ? selected.specialties.join('، ') : ''} />
                        </InfoSection>
                        <InfoSection title="بيانات التعاقد">
                            <InfoRow label="تاريخ بدء التعاقد" value={selected.contractStartDate} />
                            <InfoRow label="تاريخ انتهاء التعاقد" value={selected.contractEndDate} />
                        </InfoSection>
                        <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                            <Button variant="secondary" onClick={() => setIsFormOpen(true)}><Edit size={16}/> تعديل</Button>
                            {userRole === 'admin' && (
                                <Button variant="danger" onClick={() => openDeleteConfirm(selected.id)}><Trash2 size={16}/> حذف</Button>
                            )}
                        </div>
                    </div>
                </Modal>
            )}

            {isFormOpen && <TrainerForm isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setSelected(null); }} onSave={handleSave} trainer={selected} />}
            <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDelete} title="تأكيد الحذف" message="هل أنت متأكد من رغبتك في حذف بيانات هذا المدرب؟" />
        </div>
    );
};

const TrainerForm = ({ isOpen, onClose, onSave, trainer }) => {
    const [formData, setFormData] = useState(
        trainer ? { ...trainer, specialties: Array.isArray(trainer.specialties) ? trainer.specialties.join(', ') : '' } : 
        { fullName: '', phoneNumber: '', address: '', nationalId: '', dob: '', motherName: '', education: '', contractStartDate: '', contractEndDate: '', specialties: '' }
    );

    const handleChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={trainer ? 'تعديل بيانات المدرب' : 'إضافة مدرب جديد'} size="4xl">
            <form onSubmit={handleSubmit}>
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
                <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
                    <Button variant="secondary" onClick={onClose}>إلغاء</Button>
                    <Button type="submit">حفظ البيانات</Button>
                </div>
            </form>
        </Modal>
    );
};


// --- مكونات قسم الجدولة ---
const ScheduleView = ({ data, userId, userRole }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDayEvents, setSelectedDayEvents] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const calendarDays = useMemo(() => {
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const startDay = startOfMonth.getDay();
        const daysInMonth = endOfMonth.getDate();
        const dayOfWeekAsString = (dayIndex) => ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][dayIndex];

        const days = Array.from({ length: startDay }, (_, i) => ({ key: `empty-${i}`, empty: true }));
        for (let i = 1; i <= daysInMonth; i++) {
            const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            const events = data.filter(event => {
                const eventStartDate = new Date(event.startDate);
                const eventEndDate = new Date(event.endDate);
                return dayDate >= eventStartDate && dayDate <= eventEndDate && event.days.includes(dayOfWeekAsString(dayDate.getDay()));
            });
            days.push({ key: `day-${i}`, day: i, date: dayDate, events });
        }
        return days;
    }, [currentDate, data]);

    const changeMonth = (offset) => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    
    const handleSave = async (formData) => {
        const dbPath = `artifacts/${appId}/users/${userId}/schedules`;
        const { id, ...dataToSave } = formData;
        try {
            if (id) {
                await setDoc(doc(db, dbPath, id), dataToSave);
            } else {
                await addDoc(collection(db, dbPath), dataToSave);
            }
        } catch (error) { console.error("Error saving schedule:", error); }
        setIsFormOpen(false);
        setSelectedEvent(null);
    };
    
    const openDeleteConfirm = (id) => {
        setItemToDelete(id);
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (itemToDelete) {
             try {
                 await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/schedules`, itemToDelete));
             } catch(error) { console.error("Error deleting schedule:", error); }
            setIsConfirmOpen(false);
            setItemToDelete(null);
            setSelectedDayEvents(null); // Close details modal after delete
        }
    };
    
    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                 <h3 className="text-2xl font-bold">{currentDate.toLocaleString('ar-EG', { month: 'long', year: 'numeric' })}</h3>
                 <div className="flex gap-2">
                    <Button onClick={() => changeMonth(-1)}>الشهر السابق</Button>
                    <Button onClick={() => changeMonth(1)}>الشهر التالي</Button>
                 </div>
                 <Button onClick={() => { setSelectedEvent(null); setIsFormOpen(true); }}><PlusCircle/> إضافة موعد جديد</Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-gray-600 mb-2">
                {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => <div key={day} className="py-2">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
                {calendarDays.map(dayInfo => (
                    <div key={dayInfo.key} className={`border rounded-lg h-32 flex flex-col items-center p-2 ${dayInfo.empty ? 'bg-gray-50' : 'cursor-pointer hover:bg-blue-50 transition-colors'}`} onClick={() => !dayInfo.empty && dayInfo.events.length > 0 && setSelectedDayEvents(dayInfo)}>
                        {!dayInfo.empty && <>
                            <span className="font-bold">{dayInfo.day}</span>
                            <div className="mt-1 space-y-1 w-full overflow-hidden">
                               {dayInfo.events.map(event => <div key={event.id} className="text-xs bg-blue-200 text-blue-800 p-1 rounded truncate" title={event.courseName}>{event.courseName}</div>)}
                            </div>
                        </>}
                    </div>
                ))}
            </div>

            {selectedDayEvents && (
                <Modal isOpen={!!selectedDayEvents} onClose={() => setSelectedDayEvents(null)} title={`جدول يوم ${selectedDayEvents.day} ${currentDate.toLocaleString('ar-EG', { month: 'long' })}`}>
                       <div className="space-y-4">
                            {selectedDayEvents.events.map(event => (
                                <div key={event.id} className="p-4 bg-light-blue-50 rounded-lg border border-blue-200">
                                    <h4 className="font-bold text-xl text-blue-800 mb-3">{event.courseName}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <InfoRow label="القاعة" value={event.hall} icon={<Building />} />
                                        <InfoRow label="القسم" value={event.category} icon={<Tag />} />
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4">
                                        <Button variant="secondary" onClick={() => { setSelectedEvent(event); setIsFormOpen(true); setSelectedDayEvents(null); }}><Edit size={14}/></Button>
                                        <Button variant="danger" onClick={() => openDeleteConfirm(event.id)}><Trash2 size={14}/></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                </Modal>
            )}
             {isFormOpen && <ScheduleForm isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setSelectedEvent(null); }} onSave={handleSave} schedule={selectedEvent} />}
             <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDelete} title="تأكيد الحذف" message="هل أنت متأكد من حذف هذا الموعد من الجدول؟" />
        </div>
    );
};

const ScheduleForm = ({ isOpen, onClose, onSave, schedule }) => {
    const ALL_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const [formData, setFormData] = useState(
        schedule ? schedule : { courseName: '', hall: '', category: '', startTime: '', endTime: '', startDate: '', endDate: '', days: [], traineeCount: 0, plan: '', materials: '' }
    );

    const handleChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value });
    
    const handleDayChange = (day) => {
        const newDays = formData.days.includes(day)
            ? formData.days.filter(d => d !== day)
            : [...formData.days, day];
        setFormData({ ...formData, days: newDays });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={schedule ? 'تعديل موعد' : 'إضافة موعد جديد'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                    <Input label="اسم الكورس" id="courseName" value={formData.courseName} onChange={handleChange} required />
                    <Input label="القاعة" id="hall" value={formData.hall} onChange={handleChange} />
                    <Input label="القسم" id="category" value={formData.category} onChange={handleChange} />
                    <Input label="عدد المتدربين" id="traineeCount" type="number" value={formData.traineeCount} onChange={handleChange} />
                    <Input label="وقت البدء" id="startTime" type="time" value={formData.startTime} onChange={handleChange} />
                    <Input label="وقت الانتهاء" id="endTime" type="time" value={formData.endTime} onChange={handleChange} />
                    <Input label="تاريخ البدء" id="startDate" type="date" value={formData.startDate} onChange={handleChange} />
                    <Input label="تاريخ الانتهاء" id="endDate" type="date" value={formData.endDate} onChange={handleChange} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">أيام الكورس</label>
                    <div className="flex flex-wrap gap-3">
                        {ALL_DAYS.map(day => (
                            <label key={day} className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer">
                                <input type="checkbox" checked={formData.days.includes(day)} onChange={() => handleDayChange(day)} />
                                {day}
                            </label>
                        ))}
                    </div>
                </div>
                <Textarea label="خطة مسار الكورس" id="plan" value={formData.plan} onChange={handleChange} />
                <Textarea label="المواد/الأدوات المطلوبة" id="materials" value={formData.materials} onChange={handleChange} />
                 <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
                    <Button variant="secondary" onClick={onClose}>إلغاء</Button>
                    <Button type="submit">حفظ الموعد</Button>
                </div>
            </form>
        </Modal>
    );
};


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
