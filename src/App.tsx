import { useState, useMemo, useEffect } from 'react';

import { Network, GitMerge, Fingerprint, Lock, Unlock, Hash, Key } from 'lucide-react';
import { generateM1, generateM2, multiplyMatrices, generateKeyMatrix, inverseMatrix, type Matrix } from './crypto/graphCipher';

const App = () => {
  const [text, setText] = useState<string>('NODE');
  const [keyword, setKeyword] = useState<string>('KEY');
  const [keyMatrix, setKeyMatrix] = useState<Matrix>([]);
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');

  // Padding text to exactly 4 chars for visualization
  const paddedText = useMemo(() => {
    let t = text.replace(/[^A-Za-z]/g, '').toUpperCase();
    if (t.length > 4) t = t.substring(0, 4);
    while (t.length < 4) t += 'X';
    return t;
  }, [text]);

  const paddedKeyword = useMemo(() => keyword.toUpperCase() || 'K', [keyword]);

  // Generate K only when paddedText length changes (fixed to 4 here)
  useEffect(() => {
    setKeyMatrix(generateKeyMatrix(4));
  }, []);

  const M1 = useMemo(() => generateM1(paddedText, paddedKeyword), [paddedText, paddedKeyword]);
  const M2 = useMemo(() => generateM2(M1), [M1]);
  const M3 = useMemo(() => multiplyMatrices(M1, M2), [M1, M2]);
  
  const ciphertextMatrix = useMemo(() => {
    if (!keyMatrix || keyMatrix.length === 0) return [];
    return multiplyMatrices(M3, keyMatrix);
  }, [M3, keyMatrix]);

  const decryptedM3 = useMemo(() => {
    if (!keyMatrix || keyMatrix.length === 0 || ciphertextMatrix.length === 0) return [];
    const invK = inverseMatrix(keyMatrix);
    if (!invK) return [];
    return multiplyMatrices(ciphertextMatrix, invK);
  }, [ciphertextMatrix, keyMatrix]);

  const renderMatrix = (matrix: Matrix, title: string, subtitle: string, icon: React.ReactNode, highlight: boolean = false) => (
    <div className={`bg-dataviz-card rounded-xl p-5 shadow-sm border ${highlight ? 'border-dataviz-violet/50 shadow-md' : 'border-gray-200'}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h3 className={`font-semibold ${highlight ? 'text-dataviz-violet' : 'text-dataviz-text'}`}>{title}</h3>
      </div>
      <p className="text-xs text-dataviz-muted mb-4">{subtitle}</p>
      
      <div className="flex justify-center">
        <div className="relative p-3 border-l-2 border-r-2 border-gray-300 rounded-sm">
          {matrix.length > 0 ? (
            <div className="grid gap-x-4 gap-y-2 text-sm font-mono text-center text-gray-600" style={{ gridTemplateColumns: `repeat(${matrix.length}, minmax(0, 1fr))` }}>
              {matrix.map((row, r) => 
                row.map((val, c) => (
                  <span key={`${r}-${c}`} className={val === 0 ? 'opacity-30' : ''}>{val}</span>
                ))
              )}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">Generating...</div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-dataviz-text tracking-tight mb-2 flex items-center justify-center gap-3">
          <Network className="text-dataviz-violet" size={36} />
          Network Cryptography Visualizer
        </h1>
        <p className="text-dataviz-muted text-lg">Graph-Based Encryption Visualization over GF(257)</p>
        <p className="text-dataviz-violet text-sm mt-2 font-mono font-semibold">Developed by Divyanshu Rai</p>
      </header>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-dataviz-muted uppercase tracking-wider mb-2">Plaintext (4 letters)</label>
          <input 
            type="text" 
            value={text} 
            onChange={e => setText(e.target.value)}
            maxLength={4}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-dataviz-text font-mono text-xl focus:border-dataviz-violet focus:ring-1 focus:ring-dataviz-violet focus:outline-none uppercase"
          />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-dataviz-muted uppercase tracking-wider mb-2">Keyword</label>
          <input 
            type="text" 
            value={keyword} 
            onChange={e => setKeyword(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-dataviz-text font-mono text-xl focus:border-dataviz-violet focus:ring-1 focus:ring-dataviz-violet focus:outline-none uppercase"
          />
        </div>
        <div className="flex-shrink-0 flex gap-2 self-end pb-1">
           <button 
            onClick={() => setMode('encrypt')}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${mode === 'encrypt' ? 'bg-dataviz-violet text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
           >
             <Lock size={18} /> Encrypt
           </button>
           <button 
            onClick={() => setMode('decrypt')}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${mode === 'decrypt' ? 'bg-dataviz-green text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
           >
             <Unlock size={18} /> Decrypt
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {mode === 'encrypt' ? (
          <>
            {renderMatrix(M1, "Matrix M1", "Complete Graph Adjacency", <Hash size={18} className="text-gray-400"/>)}
            {renderMatrix(M2, "Matrix M2", "Minimum Spanning Tree", <GitMerge size={18} className="text-gray-400"/>)}
            {renderMatrix(M3, "Matrix M3", "M1 × M2", <Fingerprint size={18} className="text-gray-400"/>)}
            {renderMatrix(ciphertextMatrix, "Ciphertext (C)", "M3 × K", <Lock size={18} className="text-dataviz-violet"/>, true)}
          </>
        ) : (
          <>
            {renderMatrix(ciphertextMatrix, "Ciphertext (C)", "Intercepted Message", <Lock size={18} className="text-gray-400"/>)}
            {renderMatrix(inverseMatrix(keyMatrix) || [], "Inverse Key (K⁻¹)", "Private Key", <Key size={18} className="text-gray-400"/>)}
            {renderMatrix(decryptedM3, "Decrypted M3", "C × K⁻¹", <Unlock size={18} className="text-dataviz-green"/>, true)}
            <div className="bg-dataviz-card rounded-xl p-5 shadow-sm border border-gray-200 flex flex-col justify-center items-center text-center h-full">
              <h3 className="font-semibold text-dataviz-text mb-4">Original Message Recovered</h3>
              <div className="text-3xl font-mono text-dataviz-green tracking-widest font-bold">
                {paddedText}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-10 bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-600 shadow-sm max-w-4xl mx-auto">
        <h4 className="font-bold text-gray-800 mb-2">Algorithm Flow</h4>
        <ol className="list-decimal pl-5 space-y-1">
          <li><strong>M1 Generation:</strong> Characters form nodes. Edge weights are computed by combining character ASCII distances and the Keyword.</li>
          <li><strong>M2 Generation:</strong> Prim's Algorithm extracts the Minimum Spanning Tree (MST) from M1.</li>
          <li><strong>M3 Generation:</strong> M1 and M2 are multiplied to create a structural mix.</li>
          <li><strong>Encryption:</strong> A secret invertible Key Matrix (K) is multiplied with M3 to produce the Ciphertext matrix.</li>
          <li>All arithmetic is performed over the Galois Field GF(257).</li>
        </ol>
      </div>

    </div>
  );
};

export default App;
