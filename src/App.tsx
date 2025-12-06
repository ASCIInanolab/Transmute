import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { save, open } from '@tauri-apps/plugin-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileVideo, FileImage, FileAudio, Check, ChevronDown, Download, RefreshCw, X, Plus } from 'lucide-react';
import { useFunnyMessages } from './hooks/useFunnyMessages';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getFileType(name: string): 'video' | 'image' | 'audio' | 'unknown' {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'ogv', 'flv', 'wmv', '3gp', 'mpg', 'vob', 'ts', 'm2ts'].includes(ext || '')) return 'video';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif', 'bmp', 'tiff', 'ico', 'tga', 'svg'].includes(ext || '')) return 'image';
  if (['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac', 'wma', 'aiff', 'alac', 'opus'].includes(ext || '')) return 'audio';
  return 'unknown';
}

// --- Constants ---
const FORMATS = {
  video: ['MP4', 'GIF', 'MKV', 'AVI', 'MOV', 'WEBM', 'OGV', 'FLV', 'WMV', '3GP', 'MPG', 'VOB', 'TS', 'M2TS'],
  image: ['PNG', 'JPG', 'WEBP', 'AVIF', 'BMP', 'TIFF', 'ICO', 'TGA', 'SVG'],
  audio: ['MP3', 'WAV', 'M4A', 'OGG', 'FLAC', 'AAC', 'WMA', 'AIFF', 'ALAC', 'OPUS'],
};

// --- Types ---
type AppState = 'IDLE' | 'SELECTION' | 'PROCESSING' | 'FINISHED';

interface FileInfo {
  path: string;
  name: string;
  type: 'video' | 'image' | 'audio' | 'unknown';
  status?: 'pending' | 'converting' | 'done' | 'error';
  convertedPath?: string;
}

// --- Components ---

/**
 * Custom Dropdown Component
 * A minimalist, custom-styled dropdown for format selection.
 */
function FormatDropdown({ current, options, onSelect }: { current: string, options: string[], onSelect: (fmt: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative z-50" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-white font-medium min-w-[140px] justify-between backdrop-blur-md"
      >
        <span>{current}</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen ? "rotate-180" : "")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute top-full mt-2 left-0 w-full max-h-60 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl p-2 custom-scrollbar"
          >
            {options.map(fmt => (
              <button
                key={fmt}
                onClick={() => { onSelect(fmt); setIsOpen(false); }}
                className={cn(
                  "w-full text-left px-4 py-2 rounded-xl text-sm transition-colors",
                  current === fmt ? "bg-purple-600 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                {fmt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Main App ---
function App() {
  const [state, setState] = useState<AppState>('IDLE');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [format, setFormat] = useState('MP4');
  const [error, setError] = useState<string | null>(null);

  // Fake progress state for the bar
  const [progress, setProgress] = useState(0);

  const funnyMessage = useFunnyMessages();

  // --- Logic ---

  const addFiles = (paths: string[]) => {
    if (paths.length === 0) return;
    const newFiles: FileInfo[] = paths.map(path => {
      const name = path.split(/[/\\]/).pop() || 'Unknown File';
      return { path, name, type: getFileType(name), status: 'pending' };
    });

    setFiles(prev => {
      const combined = [...prev, ...newFiles];
      // Auto-set format based on first file type if not set
      if (combined.length > 0 && prev.length === 0) {
        const firstType = combined[0].type;
        if (firstType === 'image') setFormat('PNG');
        else if (firstType === 'audio') setFormat('MP3');
        else setFormat('MP4');
      }
      return combined;
    });
    setState('SELECTION');
  };

  const openFilePicker = async () => {
    try {
      const selected = await open({ multiple: true, filters: [{ name: 'Media', extensions: ['*'] }] });
      if (Array.isArray(selected)) addFiles(selected);
      else if (selected) addFiles([selected]);
    } catch (err) { console.error(err); }
  };

  const reset = () => {
    setState('IDLE');
    setFiles([]);
    setError(null);
    setProgress(0);
  };

  // Drag & Drop Listener
  useEffect(() => {
    const unlisten = listen<{ paths: string[] }>('tauri://drag-drop', (event) => {
      if (state === 'PROCESSING') return;
      addFiles(event.payload.paths);
    });
    return () => { unlisten.then(f => f()); };
  }, [state]);

  const handleConvert = async () => {
    if (files.length === 0) return;

    setState('PROCESSING');
    setError(null);
    setProgress(0);

    const startTime = Date.now();
    const updatedFiles = [...files];

    try {
      // Simulate progress for visual feedback
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + (Math.random() * 5), 90));
      }, 200);

      for (let i = 0; i < updatedFiles.length; i++) {
        updatedFiles[i].status = 'converting';
        // We don't update state here to avoid re-renders killing the animation smoothness too much, 
        // relying on the progress bar mostly.

        try {
          const result = await invoke<string>('convert_file', { filePath: updatedFiles[i].path, outputFormat: format });
          updatedFiles[i].convertedPath = result;
          updatedFiles[i].status = 'done';
        } catch (e) {
          console.error(e);
          updatedFiles[i].status = 'error';
        }
      }

      clearInterval(progressInterval);
      setProgress(100);
      setFiles(updatedFiles); // Final update

      const duration = Date.now() - startTime;

      // "Funny messages unless it takes under 3 seconds" logic
      if (duration < 3000) {
        // Instant finish
        setState('FINISHED');
      } else {
        // Slight delay to show 100%
        setTimeout(() => setState('FINISHED'), 500);
      }

    } catch (e: unknown) {
      setError(typeof e === 'string' ? e : 'Conversion failed');
      setState('SELECTION');
    }
  };

  const handleDownload = async () => {
    // Single file save
    if (files.length === 1 && files[0].convertedPath) {
      try {
        const ext = format.toLowerCase();
        const savePath = await save({ defaultPath: `converted_${files[0].name.split('.')[0]}.${ext} `, filters: [{ name: format, extensions: [ext] }] });
        if (savePath) await invoke('save_file_locally', { source: files[0].convertedPath!, destination: savePath });
      } catch { setError("Failed to save file"); }
      return;
    }
    // Batch save
    if (files.length > 1) {
      try {
        const selectedDir = await open({ directory: true, multiple: false });
        if (selectedDir && typeof selectedDir === 'string') {
          for (const file of files) {
            if (file.convertedPath && file.status === 'done') {
              const ext = format.toLowerCase();
              await invoke('save_file_locally', { source: file.convertedPath, destination: `${selectedDir}/converted_${file.name.split('.')[0]}.${ext}` });
            }
          }
        }
      } catch { setError("Failed to save files"); }
    }
  };

  // Specific filename logic: "Name..." if multiple
  const getFileSummary = () => {
    if (files.length === 0) return '';
    if (files.length === 1) return files[0].name;
    return files[0].name + '...';
  };

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center font-sans overflow-hidden selection:bg-purple-500/30 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/5 to-black pointer-events-none" />

      <AnimatePresence mode="wait">

        {/* --- IDLE STATE --- */}
        {state === 'IDLE' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center z-10"
          >
            <div
              onClick={openFilePicker}
              className="group cursor-pointer relative w-64 h-64 flex items-center justify-center"
            >
              {/* Animated Pulse Circle */}
              <div className="absolute inset-0 bg-purple-600/20 rounded-full animate-[ping_3s_ease-in-out_infinite]" />
              <div className="absolute inset-0 bg-purple-600/10 rounded-full animate-[pulse_4s_ease-in-out_infinite]" />

              {/* Main Circle */}
              <div className="relative w-48 h-48 bg-[#111] border border-white/10 rounded-full flex items-center justify-center shadow-2xl group-hover:border-purple-500/50 group-hover:shadow-[0_0_50px_rgba(147,51,234,0.3)] transition-all duration-500">
                <Upload className="w-16 h-16 text-white/20 group-hover:text-purple-400 transition-colors duration-300" />
              </div>
            </div>

            <h1 className="mt-8 text-4xl font-light tracking-tight text-white/90">Transmute</h1>
            <p className="mt-2 text-sm text-white/30 uppercase tracking-[0.2em] font-medium">Click or Drop</p>
          </motion.div>
        )}

        {/* --- SELECTION STATE --- */}
        {state === 'SELECTION' && (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            className="flex flex-col items-center justify-center w-full max-w-2xl px-8 z-10"
          >
            {/* Central Icon */}
            <div className="mb-10 relative">
              <div className="w-32 h-32 bg-[#111] border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl">
                {files[0]?.type === 'video' ? <FileVideo className="w-12 h-12 text-blue-400" /> :
                  files[0]?.type === 'audio' ? <FileAudio className="w-12 h-12 text-purple-400" /> :
                    <FileImage className="w-12 h-12 text-pink-400" />}
              </div>
              {files.length > 1 && (
                <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-black">
                  {files.length}
                </div>
              )}
            </div>

            {/* Filename Summary */}
            <h2 className="text-xl font-light text-center mb-12 text-white/80 break-all leading-relaxed max-w-lg">
              {getFileSummary()}
            </h2>

            {/* Controls */}
            <div className="flex flex-col items-center gap-6 w-full max-w-xs">
              <div className="w-full flex justify-center">
                <FormatDropdown
                  current={format}
                  options={(FORMATS[files[0]?.type === 'unknown' ? 'video' : files[0]?.type] || FORMATS.video)}
                  onSelect={setFormat}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleConvert}
                className="w-full py-4 bg-white text-black rounded-full font-bold text-lg shadow-lg shadow-white/10 hover:shadow-white/20 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Convert
              </motion.button>

              <button onClick={reset} className="text-white/30 hover:text-white transition-colors text-sm uppercase tracking-wider font-medium pt-4">
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* --- PROCESSING --- */}
        {state === 'PROCESSING' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center w-full max-w-xl z-10 text-center"
          >
            <h3 className="text-2xl font-light text-white mb-8">Transmuting...</h3>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-6 relative">
              <motion.div
                className="absolute top-0 left-0 h-full bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "linear" }}
              />
            </div>

            {/* Funny Message */}
            <p className="text-lg text-white/50 animate-pulse min-h-[1.5em]">
              {funnyMessage}
            </p>
          </motion.div>
        )}

        {/* --- FINISHED --- */}
        {state === 'FINISHED' && (
          <motion.div
            key="finished"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center w-full max-w-sm z-10"
          >
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-8 border border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
              <Check className="w-10 h-10 text-green-500" />
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">Complete</h2>
            <p className="text-white/40 mb-10 text-center">
              {files.filter(f => f.status === 'done').length} files ready to save.
            </p>

            <div className="flex flex-col gap-4 w-full">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleDownload}
                className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-bold shadow-lg shadow-green-900/40 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                {files.length > 1 ? 'Save All Files' : 'Download'}
              </motion.button>

              <button
                onClick={reset}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-2xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Start New
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 bg-red-500/10 border border-red-500/20 backdrop-blur-md text-red-200 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 z-50"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {error}
            <button onClick={() => setError(null)} className="hover:text-white"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
