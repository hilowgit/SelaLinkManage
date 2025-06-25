// Version: SUPABASE-FINAL - 25/06/2025
import React, { useState, useEffect, useMemo, useRef } from 'react';
// --- استيراد مكتبة Supabase ---
import { createClient } from '@supabase/supabase-js';
import { Search, User, Users, Calendar, BookOpen, Edit, Trash2, PlusCircle, X, Clock, Building, Tag, Users as TraineesIcon, ClipboardList, List, DollarSign, Award, Percent, Star, XCircle, CheckCircle, BarChart2, Briefcase, AlertTriangle } from 'lucide-react';

// --- تهيئة Supabase باستخدام متغيرات البيئة (الطريقة الصحيحة لـ Netlify) ---
console.log("RUNNING CODE VERSION: SUPABASE-FINAL");

let supabase;
let supabaseInitializationError = null;

// Vite يتطلب أن تبدأ المتغيرات بـ VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

try {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase URL or Anon Key is not configured in environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).");
    }
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (e) {
    console.error("Supabase Initialization Failed:", e);
    supabaseInitializationError = e;
}


// --- مكونات واجهة المستخدم المساعدة (تبقى كما هي) ---
const Modal = ({ children, isOpen, onClose, title, size = '2xl' }) => {
    if (!isOpen) return null;
    const sizeClasses = { 'md': 'max-w-md', 'lg': 'max-w-lg', 'xl': 'max-w-xl', '2xl': 'max-w-2xl', '4xl': 'max-w-4xl' };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors duration-300 p-1 rounded-full hover:bg-gray-100"><X size={24} /></button>
                </div>
                <div className="overflow-y-auto p-6">{children}</div>
            </div>
        </div>
    );
};

// ... (باقي المكونات المساعدة ConfirmModal, Input, Textarea, Button تبقى كما هي)
// ... يمكنك نسخها من إجاباتي السابقة أو إبقائها كما هي إذا لم تتغير

// --- البيانات المبدئية (تبقى كما هي) ---
const initialTrainees = [
    // ... نفس بيانات المتدربين الأولية ...
];
const initialTrainers = [
    // ... نفس بيانات المدربين الأولية ...
];
const initialSchedules = [
    // ... نفس بيانات الجدولة الأولية ...
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
    
    const loadStatus = useRef({ trainees: false, trainers: false, schedules: false });
    const seededStatus = useRef({ trainees: false, trainers: false, schedules: false });

    if (supabaseInitializationError) {
        return (
            <div dir="rtl" className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
                    <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">خطأ فادح في تهيئة التطبيق</h1>
                    <p className="text-gray-600 mb-6">لا يمكن بدء تشغيل التطبيق بسبب مشكلة في إعدادات Supabase.</p>
                    <div className="text-left bg-red-50 p-4 rounded-lg">
                        <p className="font-semibold text-red-800">تفاصيل الخطأ:</p>
                        <pre className="text-sm text-red-700 whitespace-pre-wrap break-all">{supabaseInitializationError.message}</pre>
                    </div>
                    <p className="mt-6 text-sm text-gray-500">يرجى التأكد من إعداد متغيرات البيئة (Environment Variables) بشكل صحيح في Netlify.</p>
                </div>
            </div>
        );
    }

    // --- useEffect جديد للمصادقة مع Supabase ---
    useEffect(() => {
        if (!supabase) return;
        console.log("Setting up Supabase auth state listener...");
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            const user = session?.user;
            setUserId(user?.id || null);
            setIsAuthReady(true);
            console.log("Auth state changed. User:", user?.id);
        });

        return () => {
            console.log("Cleaning up Supabase auth state listener.");
            subscription?.unsubscribe();
        };
    }, []);

    // --- useEffect لجلب البيانات باستخدام Supabase Realtime ---
    useEffect(() => {
        if (!isAuthReady || !userId || !supabase) {
            console.log("Data fetching skipped:", { isAuthReady, userId, supabase: !!supabase });
            // إذا لم يكن هناك مستخدم، ربما لا نعرض أي بيانات أو نعرض حالة فارغة
             if(isAuthReady && !userId) setLoading(false);
            return;
        }

        console.log(`Starting data fetch for user ID: ${userId}`);
        setLoading(true);
        loadStatus.current = { trainees: false, trainers: false, schedules: false };
        
        const tables = { trainees: 'trainees', trainers: 'trainers', schedules: 'schedules' };
        const setters = { trainees: setTrainees, trainers: setTrainers, schedules: setSchedules };
        const initialDataMap = { trainees: initialTrainees, trainers: initialTrainers, schedules: initialSchedules };

        const checkAllLoaded = () => {
            if (Object.values(loadStatus.current).every(status => status)) {
                console.log("All tables have reported their status. Setting loading to false.");
                setLoading(false);
            }
        };

        const fetchAndSeed = async (tableName) => {
            console.log(`Fetching initial data for '${tableName}'...`);
            const { data, error, count } = await supabase.from(tableName).select('*', { count: 'exact' }).eq('user_id', userId);

            if (error) {
                console.error(`Error fetching data for ${tableName}:`, error);
                loadStatus.current[tableName] = true;
                checkAllLoaded();
                return;
            }

            if (count === 0 && !seededStatus.current[tableName]) {
                console.log(`Table '${tableName}' is empty, attempting to seed initial data.`);
                seededStatus.current[tableName] = true; 
                
                // لا نضع id في البيانات الأولية لأن Supabase سيقوم بإنشائه
                const initialData = initialDataMap[tableName].map(({ id, ...item }) => ({ ...item, user_id: userId }));

                const { error: insertError } = await supabase.from(tableName).insert(initialData);
                if (insertError) {
                    console.error(`Error seeding data for '${tableName}':`, insertError);
                    setters[tableName]([]);
                }
            } else {
                setters[tableName](data);
                console.log(`Updated state for '${tableName}' with ${data.length} documents.`);
            }

            if (!loadStatus.current[tableName]) {
                loadStatus.current[tableName] = true;
                checkAllLoaded();
            }
        };

        Object.keys(tables).forEach(key => fetchAndSeed(key));

        const subscriptions = Object.keys(tables).map(key => {
            const tableName = tables[key];
            return supabase
                .channel(`public:${tableName}:${userId}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: tableName, filter: `user_id=eq.${userId}` }, (payload) => {
                    console.log(`Realtime change received for ${tableName}:`, payload);
                    fetchAndSeed(tableName); 
                })
                .subscribe();
        });

        return () => {
            console.log("Cleaning up all Supabase subscriptions.");
            subscriptions.forEach(sub => sub.unsubscribe());
        };
    }, [isAuthReady, userId]);

    const renderContent = () => {
        // ... (نفس دالة renderContent)
    };
    
    // ... (نفس JSX للعرض الرئيسي)

}

// --- مكونات قسم المدربين (مع تعديل CRUD ورفع الملفات) ---
const TrainersView = ({ data, userId, userRole }) => {
    // ...
    const handleSave = async (formData) => {
        const { id, ...rest } = formData;
        if (typeof rest.specialties === 'string') {
            rest.specialties = rest.specialties.split(',').map(s => s.trim()).filter(Boolean);
        }
        const dataToSave = id ? { id, ...rest, user_id: userId } : { ...rest, user_id: userId };

        try {
            const { error } = await supabase.from('trainers').upsert(dataToSave);
            if (error) throw error;
        } catch (error) { console.error("Error saving trainer:", error); }
        //...
    };
    //...
};

const TrainerForm = ({ isOpen, onClose, onSave, trainer }) => {
    // ...
    const handleSubmit = async (e) => {
        e.preventDefault();
        let finalFormData = { ...formData };

        if (cvFile) {
            setIsUploading(true);
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) {
                alert("User not authenticated, cannot upload file.");
                setIsUploading(false);
                return;
            }
            const filePath = `${user.id}/${Date.now()}-${cvFile.name}`;

            try {
                // رفع الملف إلى Supabase Storage
                const { error: uploadError } = await supabase.storage
                    .from('cvs') // اسم الحاوية
                    .upload(filePath, cvFile);

                if (uploadError) throw uploadError;

                // الحصول على الرابط العام للملف
                const { data: urlData } = supabase.storage
                    .from('cvs')
                    .getPublicUrl(filePath);
                
                finalFormData.cvUrl = urlData.publicUrl;
            } catch (error) {
                console.error("Error uploading file:", error);
                alert("حدث خطأ أثناء رفع الملف. الرجاء المحاولة مرة أخرى.");
                setIsUploading(false);
                return;
            } finally {
                setIsUploading(false);
            }
        }
        
        onSave(finalFormData);
        if(onClose) onClose();
    };
    // ...
};

// ... (باقي المكونات مثل TraineesView, ScheduleView يتم تعديل دوال الحفظ والحذف فيها بنفس طريقة TrainersView)
// على سبيل المثال في TraineesView
const handleSave = async (formData) => {
    const dataToSave = { ...formData, user_id: userId };
    try {
        // نستخدم upsert للتبسيط
        const { error } = await supabase.from('trainees').upsert(dataToSave);
        if (error) throw error;
    } catch (error) { console.error("Error saving trainee:", error); }
    
    setIsFormOpen(false);
    setSelected(null);
};

const handleDelete = async () => {
    if (itemToDelete) {
         try {
             const { error } = await supabase.from('trainees').delete().match({ id: itemToDelete });
             if(error) throw error;
         } catch(error) { console.error("Error deleting trainee:", error); }
        
        setIsConfirmOpen(false);
        setItemToDelete(null);
        if(selected?.id === itemToDelete) setSelected(null);
    }
};
