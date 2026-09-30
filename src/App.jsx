import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';

export default function App() {
  const [image, setImage] = useState(null);
  const [chassiNumber, setChassiNumber] = useState('');
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

    try {
      // Analizar texto con Tesseract.js
      const { data: { text } } = await Tesseract.recognize(imageUrl, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setStatus(`Analizando números... ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      // Extraer números de 6 a 8 dígitos (ejemplo: 4106630)
      const matches = text.match(/\b\d{6,8}\b/g);

      if (matches && matches.length > 0) {
        setChassiNumber(matches[0]);
        setStatus('¡Número detectado! Revisa y confirma.');
      } else {
        setStatus('No se detectó el número. Ingrésalo manualmente.');
      }
    } catch (err) {
      console.error(err);
      setStatus('Error al procesar la imagen.');
    } finally {
      setLoading(false);
    }
  };

  // Guardar datos (Simulación para el demo)
  const handleSave = () => {
    if (!chassiNumber) return;
    setSavedSuccess(true);
    setStatus(`✅ ¡Chassi ${chassiNumber} registrado con éxito!`);
    
    setTimeout(() => {
      setImage(null);
      setChassiNumber('');
      setSavedSuccess(false);
      setStatus('');
    }, 3000);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', color: '#1a1a1a' }}>Inventario Chasis</h2>

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
            style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #ccc' }}
          />
        </div>
      )}

      {status && (
        <p style={{ textAlign: 'center', fontWeight: 'bold', color: savedSuccess ? 'green' : '#333' }}>
          {status}
        </p>
      )}

      <div style={{ marginTop: '15px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
          Número de Chassi:
        </label>
        <input
          type="text"
          value={chassiNumber}
          onChange={(e) => setChassiNumber(e.target.value)}
          placeholder="Ej: 4106630"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '22px',
            textAlign: 'center',
            fontWeight: 'bold',
            borderRadius: '8px',
            border: '2px solid #ccc',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={!chassiNumber || loading}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '16px',
          backgroundColor: chassiNumber ? '#28a745' : '#cccccc',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: chassiNumber ? 'pointer' : 'not-allowed',
          marginTop: '15px'
        }}
      >
        💾 Confirmar y Guardar
      </button>
    </div>
  );
}