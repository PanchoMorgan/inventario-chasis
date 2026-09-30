import React, { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';

export default function App() {
  const [image, setImage] = useState(null);
  const [chassisNumber, setChassisNumber] = useState('');
  const [popIdNumber, setPopIdNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', type: '' });
  const [returnUrl, setReturnUrl] = useState('');

  const fileInputRef = useRef(null);

  // Al cargar, capturamos si Power Apps nos pasó una URL de retorno
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callback = params.get('returnUrl');
    if (callback) {
      setReturnUrl(callback);
    }
  }, []);

  // Escaneo OCR con Tesseract.js
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setImage(imageUrl);
    setStatus({ message: 'Procesando imagen con OCR...', type: 'info' });
    setLoading(true);
    setChassisNumber('');
    setPopIdNumber('');

    try {
      const { data: { text } } = await Tesseract.recognize(imageUrl, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setStatus({ message: `Analizando números... ${Math.round(m.progress * 100)}%`, type: 'info' });
          }
        },
      });

      // Extraer Chassis (7 dígitos) y Pop ID (6 dígitos)
      const chassisMatches = text.match(/\b\d{7}\b/g);
      const popMatches = text.match(/\b\d{6}\b/g);

      if (chassisMatches && chassisMatches.length > 0) {
        setChassisNumber(chassisMatches[0]);
      }

      if (popMatches && popMatches.length > 0) {
        setPopIdNumber(popMatches[0]);
      }

      if ((chassisMatches && chassisMatches.length > 0) || (popMatches && popMatches.length > 0)) {
        setStatus({ message: '¡Datos detectados con éxito!', type: 'success' });
      } else {
        setStatus({ message: 'No se detectaron números claros. Ingrésalos manualmente.', type: 'warning' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ message: 'Error al procesar la imagen.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Enviar los datos de vuelta de forma segura
  const handleReturnToPowerApps = () => {
    if (!chassisNumber && !popIdNumber) return;

    // Si tenemos una URL de retorno válida provista por Power Apps
    if (returnUrl && returnUrl.startsWith('http')) {
      const finalRedirect = `${returnUrl}&chasis=${encodeURIComponent(chassisNumber)}&popid=${encodeURIComponent(popIdNumber)}`;
      window.location.href = finalRedirect;
    } else {
      // Método seguro de respaldo: Copiar al portapapeles para pegar en Power Apps
      const textoACopiar = `Chassis: ${chassisNumber} | PopID: ${popIdNumber}`;
      navigator.clipboard.writeText(textoACopiar).then(() => {
        setStatus({ message: '📋 ¡Códigos copiados! Pégalos en Power Apps.', type: 'success' });
      }).catch(() => {
        alert(`Chassis: ${chassisNumber} \nPopID: ${popIdNumber}`);
      });
    }
  };

  const getStatusColor = () => {
    switch (status.type) {
      case 'success': return '#28a745';
      case 'warning': return '#d97706';
      case 'error': return '#dc3545';
      default: return '#1a1a1a';
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', color: '#1a1a1a', marginBottom: '4px' }}>Escáner OCR Chasis</h2>
      <p style={{ textAlign: 'center', color: '#666', fontSize: '13px', marginTop: 0 }}>
        Captura de datos para Power Apps
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
          marginBottom: '15px',
          marginTop: '10px'
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

      {status.message && (
        <p style={{ textAlign: 'center', fontWeight: 'bold', color: getStatusColor(), fontSize: '14px', padding: '0 5px' }}>
          {status.message}
        </p>
      )}

      {/* Campo Chassis */}
      <div style={{ marginTop: '15px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px', color: '#0066cc' }}>
          Número de Chassis (7 dígitos):
        </label>
        <input
          type="text"
          value={chassisNumber}
          onChange={(e) => setChassisNumber(e.target.value)}
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

      {/* Campo Pop ID */}
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
        onClick={handleReturnToPowerApps}
        disabled={(!chassisNumber && !popIdNumber) || loading}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '16px',
          backgroundColor: (chassisNumber || popIdNumber) && !loading ? '#28a745' : '#cccccc',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: (chassisNumber || popIdNumber) && !loading ? 'pointer' : 'not-allowed',
          marginTop: '20px'
        }}
      >
        ✅ Usar estos datos en Power Apps
      </button>
    </div>
  );
}