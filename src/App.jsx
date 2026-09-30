import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';

export default function App() {
  const [image, setImage] = useState(null);
  const [chassiNumber, setChassiNumber] = useState('');
  const [popIdNumber, setPopIdNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  
  const fileInputRef = useRef(null);

  // Procesar foto seleccionada o tomada con la cámara
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setImage(imageUrl);
    setSavedSuccess(false);
    setLoading(true);
    setStatus('Procesando imagen con OCR...');
    setChassiNumber('');
    setPopIdNumber('');

    try {
      // Analizar texto con Tesseract.js
      const { data: { text } } = await Tesseract.recognize(imageUrl, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setStatus(`Analizando números... ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      // 1. Extraer números de exactamente 7 dígitos (Prioridad: Chassi)
      const chassiMatches = text.match(/\b\d{7}\b/g);
      // 2. Extraer números de exactamente 6 dígitos (Pop Id)
      const popMatches = text.match(/\b\d{6}\b/g);

      if (chassiMatches && chassiMatches.length > 0) {
        setChassiNumber(chassiMatches[0]);
      }

      if (popMatches && popMatches.length > 0) {
        setPopIdNumber(popMatches[0]);
      }

      if ((chassiMatches && chassiMatches.length > 0) || (popMatches && popMatches.length > 0)) {
        setStatus('¡Campos detectados! Revisa y confirma.');
      } else {
        setStatus('No se detectaron números claros. Ingrésalos manualmente.');
      }
    } catch (err) {
      console.error(err);
      setStatus('Error al procesar la imagen.');
    } finally {
      setLoading(false);
    }
  };

  // Guardar datos
  const handleSave = () => {
    if (!chassiNumber && !popIdNumber) return;
    setSavedSuccess(true);
    setStatus(`✅ ¡Registro guardado! Chassi: ${chassiNumber || 'N/A'} | Pop ID: ${popIdNumber || 'N/A'}`);
    
    setTimeout(() => {
      setImage(null);
      setChassiNumber('');
      setPopIdNumber('');
      setSavedSuccess(false);
      setStatus('');
    }, 3500);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', color: '#1a1a1a', marginBottom: '4px' }}>Inventario Chasis</h2>
      <p style={{ textAlign: 'center', color: '#666', fontSize: '13px', marginTop: 0 }}>
        Captura automática de Chassi (7 dígitos) y Pop ID (6 dígitos)
      </p>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />

      <button
        onClick={() => fileInputRef.current.click()}
        disabled={loading}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '16px',
          backgroundColor: '#0066cc',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer',
          marginBottom: '15px'
        }}
      >
        📷 Tomar Foto al Parabrisas
      </button>

      {image && (
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <img
            src={image}
            alt="Captura"
            style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #ccc' }}
          />
        </div>
      )}

      {status && (
        <p style={{ textAlign: 'center', fontWeight: 'bold', color: savedSuccess ? 'green' : '#333', fontSize: '14px' }}>
          {status}
        </p>
      )}

      {/* Campo Chassi (Prioridad 1 - 7 dígitos) */}
      <div style={{ marginTop: '15px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px', color: '#0066cc' }}>
          Número de Chassi (7 dígitos):
        </label>
        <input
          type="text"
          value={chassiNumber}
          onChange={(e) => setChassiNumber(e.target.value)}
          placeholder="Ej: 4106630"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '20px',
            textAlign: 'center',
            fontWeight: 'bold',
            borderRadius: '8px',
            border: '2px solid #0066cc',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Campo Pop ID (Opcional - 6 dígitos) */}
      <div style={{ marginTop: '15px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px', color: '#555' }}>
          Pop ID (6 dígitos):
        </label>
        <input
          type="text"
          value={popIdNumber}
          onChange={(e) => setPopIdNumber(e.target.value)}
          placeholder="Ej: 756998"
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '18px',
            textAlign: 'center',
            fontWeight: 'bold',
            borderRadius: '8px',
            border: '1.5px solid #ccc',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={(!chassiNumber && !popIdNumber) || loading}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '16px',
          backgroundColor: (chassiNumber || popIdNumber) ? '#28a745' : '#cccccc',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: (chassiNumber || popIdNumber) ? 'pointer' : 'not-allowed',
          marginTop: '20px'
        }}
      >
        💾 Confirmar y Guardar
      </button>
    </div>
  );
}