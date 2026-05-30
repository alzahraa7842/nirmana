import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Calendar, Save, CheckCircle2, AlertCircle, ArrowLeft, Camera, Upload, Trash2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { cn } from '../lib/utils';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchUserData = async () => {
    if (!auth.currentUser) return;
    
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        setDisplayName(data.displayName || '');
        setPhotoURL(data.photoURL || null);
        setEmail(auth.currentUser.email || '');
        
        if (data.createdAt) {
          const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          setCreatedAt(date.toLocaleDateString('id-ID', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        photoURL: photoURL,
        updatedAt: serverTimestamp()
      }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `users/${auth.currentUser?.uid}`));
      
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui' });
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Gagal memperbarui profil: ' + error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Silakan unggah file gambar.' });
      return;
    }

    // Validate size (e.g., 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ukuran gambar maksimal 2MB.' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setMessage(null);

    // Local preview for immediate feedback
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPhotoURL(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    const storageRef = ref(storage, `profiles/${auth.currentUser.uid}/avatar`);
    
    try {
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Timeout after 60 seconds
      const timeout = setTimeout(() => {
        uploadTask.cancel();
      }, 60000);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        }, 
        (error) => {
          clearTimeout(timeout);
          console.error("Upload error:", error);
          let errorMsg = 'Gagal mengunggah foto.';
          if (error.code === 'storage/unauthorized') {
            errorMsg = 'Akses ditolak. Pastikan Anda telah masuk.';
          } else if (error.code === 'storage/canceled') {
            errorMsg = 'Unggahan terlalu lama/dibatalkan. Gunakan gambar yang lebih kecil.';
          } else {
            errorMsg = `Kesalahan: ${error.message}`;
          }
          setMessage({ type: 'error', text: errorMsg });
          setIsUploading(false);
          setUploadProgress(0);
          
          // Revert to original URL if upload failed
          fetchUserData(); 
        }, 
        async () => {
          clearTimeout(timeout);
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            
            const userRef = doc(db, 'users', auth.currentUser!.uid);
            await updateDoc(userRef, {
              photoURL: url,
              updatedAt: serverTimestamp()
            }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `users/${auth.currentUser?.uid}`));

            setPhotoURL(url);
            setMessage({ type: 'success', text: 'Foto profil berhasil diperbarui.' });
          } catch (err: any) {
            setMessage({ type: 'error', text: 'Gagal memproses foto: ' + err.message });
          } finally {
            setIsUploading(false);
            setUploadProgress(0);
          }
        }
      );
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Sistem bermasalah: ' + error.message });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removePhoto = async () => {
    if (!auth.currentUser) return;
    
    setIsUploading(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        photoURL: null,
        updatedAt: serverTimestamp()
      }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `users/${auth.currentUser?.uid}`));
      
      setPhotoURL(null);
      setMessage({ type: 'success', text: 'Foto profil telah dihapus.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Gagal menghapus foto: ' + error.message });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-12 h-12 border-2 border-cyan-glow/20 border-t-cyan-glow rounded-full animate-spin"
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/app')}
          className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xs uppercase tracking-[0.4em] text-cyan-glow mb-2">Profil Saya</h2>
          <h1 className="text-4xl font-light text-white tracking-tight">Pengaturan Identitas</h1>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 md:p-12 space-y-10"
      >
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-violet-500 to-cyan-glow p-0.5 relative">
              <div className="w-full h-full rounded-[1.4rem] bg-deep-slate flex items-center justify-center overflow-hidden">
                {photoURL ? (
                  <img src={photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={48} className="text-white/20" />
                )}
              </div>
              
              <label 
                className={cn(
                  "absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-[1.4rem]",
                  isUploading && "opacity-100 cursor-wait"
                )}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-1">
                    <RefreshCw size={24} className="text-white animate-spin" />
                    <span className="text-[10px] text-white font-bold">{uploadProgress}%</span>
                  </div>
                ) : (
                  <Camera size={24} className="text-white" />
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                  className="hidden" 
                  disabled={isUploading}
                />
              </label>
            </div>

            {photoURL && !isUploading && (
              <button 
                onClick={removePhoto}
                className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-xl shadow-lg border border-rose-400/50 hover:bg-rose-600 transition-colors"
                title="Hapus Foto"
              >
                <Trash2 size={12} />
              </button>
            )}

            <div className="absolute -bottom-2 -left-2 bg-deep-slate border border-white/10 p-2 rounded-xl shadow-xl">
               <div className="w-3 h-3 bg-cyan-glow rounded-full shadow-[0_0_8px_rgba(0,242,255,0.8)]" />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl text-white font-light mb-2">{displayName || 'Jiwa Anonim'}</h3>
            <p className="text-slate-500 font-light flex items-center justify-center md:justify-start gap-2">
              <Mail size={14} />
              {email}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-1">Nama Tampilan</label>
            <div className="relative">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Masukkan nama Anda..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-cyan-glow/30 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Email Akun</p>
              <div className="flex items-center gap-2 text-slate-300">
                <Mail size={14} className="text-slate-600" />
                <span className="text-sm font-light">{email}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Bergabung Sejak</p>
              <div className="flex items-center gap-2 text-slate-300">
                <Calendar size={14} className="text-slate-600" />
                <span className="text-sm font-light">{createdAt || 'Baru saja'}</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isSaving}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all",
                isSaving 
                  ? "bg-white/5 text-slate-500 cursor-not-allowed" 
                  : "bg-cyan-glow text-deep-slate shadow-[0_0_20px_rgba(0,242,255,0.2)] hover:shadow-[0_0_30px_rgba(0,242,255,0.4)]"
              )}
            >
              {isSaving ? (
                <>Menyimpan...</>
              ) : (
                <>
                  <Save size={18} /> Simpan Perubahan
                </>
              )}
            </button>
          </div>

          {message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "p-4 rounded-2xl flex items-center gap-3 text-sm font-light",
                message.type === 'success' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              )}
            >
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </motion.div>
          )}
        </form>
      </motion.div>

      <div className="text-center pb-10">
        <p className="text-slate-600 text-[10px] uppercase tracking-widest leading-relaxed">
          Semua data Anda di enkripsi di bawah Protokol Kintsugi.<br/>
          Keamanan Anda adalah tempat perlindungan kami.
        </p>
      </div>
    </div>
  );
}
