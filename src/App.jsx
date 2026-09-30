import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';

// Configuración de SharePoint
const SHAREPOINT_SITE_URL = "https://scaniaazureservices.sharepoint.com/teams/BusinessIntelligence616";
const LIST_NAME = "InventarioChasis";

export default function App() {
  // Guardar ubicación seleccionada en localStorage para mantenerla en la sesión
  const [location, setLocation] = useState(() => {
    return localStorage.getItem('inventario_ubicacion') || 'Santiago Norte';
  });

  const [image, setImage] = useState(null);
  const [chassisNumber, setChassisNumber] = useState('');
  const [popIdNumber, setPopIdNumber] = useState('');
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem('inventario_usuario') || 'Operador';
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ message: '', type: '' });
  
  const fileInputRef = useRef(null);

  const handleLocationChange = (e) => {
    const newLocation = e.target.value;
    setLocation(newLocation);
    localStorage.setItem('inventario_ubicacion', newLocation);
  };

  const handleUserChange = (e) => {
    const newUser = e.target.value;
    setUserEmail(newUser);
    localStorage.setItem('inventario_usuario', newUser);
  };

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
        setStatus({ message: '¡Campos detectados! Revisa y confirma.', type: 'info' });
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

  // Enviar registro directamente a la Lista de SharePoint dentro del iframe
  const handleSave = async () => {
    if (!chassisNumber && !popIdNumber) return;

    setSaving(true);
    setStatus({ message: 'Guardando registro en la Lista de SharePoint...', type: 'info' });

    const now = new Date();
    const fecha = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const hora = now.toLocaleTimeString('es-CL');  // HH:MM:SS

    const payload = {
      Title: chassisNumber || '', // Columna Title del sistema renombrada a Chassis
      PopID: popIdNumber || '',
      Ubicacion: location,
      Usuario: userEmail,
      Fecha: fecha,
      Hora: hora
    };

    try {
      let requestDigest = '';
      
      // 1. Obtener el RequestDigest token directamente de SharePoint
      if (window.parent && window.parent.document && window.parent.document.getElementById('__REQUESTDIGEST')) {
        requestDigest = window.parent.document.getElementById('__REQUESTDIGEST').value;
      } else {
        const digestResponse = await fetch(`${SHAREPOINT_SITE_URL}/_api/contextinfo`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose'
          },
          credentials: 'include'
        });
        
        const digestData = await digestResponse.json();
        requestDigest = digestData.d.GetContextWebInformation.FormDigestValue;
      }

      // 2. Enviar el registro a la Lista
      const response = await fetch(`${SHAREPOINT_SITE_URL}/_api/web/lists/getbytitle('${LIST_NAME}')/items`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': requestDigest
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setStatus({ message: '✅ Registro guardado exitosamente en SharePoint!', type: 'success' });
        
        setTimeout(() => {
          setImage(null);
          setChassisNumber('');
          setPopIdNumber('');
          setStatus({ message: '', type: '' });
        }, 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error SharePoint:", errorData);
        setStatus({ message: '⚠️ Error al guardar en la lista de SharePoint.', type: 'error' });
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      setStatus({ message: '⚠️ Error de autenticación/red al guardar.', type: 'error' });
    } finally {
      setSaving(false);
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
      <h2 style={{ textAlign: 'center', color: '#1a1a1a', marginBottom: '4px' }}>Inventario Chasis</h2>
      <p style={{ textAlign: 'center', color: '#666', fontSize: '13px', marginTop: 0 }}>
        Captura automática e integración con SharePoint
      </p>

      {/* Selector de Ubicación Fija */}
      <div style={{ marginBottom: '12px', backgroundColor: '#f0f4f8', padding: '10px', borderRadius: '8px', border: '1px solid #d0dbe5' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#333' }}>
          📍 Ubicación actual:
        </label>
        <select
          value={location}
          onChange={handleLocationChange}
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '15px',
            fontWeight: 'bold',
            borderRadius: '6px',
            border: '1px solid #0066cc',
            backgroundColor: 'white',
            color: '#1a1a1a'
          }}
        >
          <option value="Santiago Norte">Santiago Norte</option>
          <option value="Santiago Sur">Santiago Sur</option>
        </select>
      </div>

      {/* Operador / Usuario */}
      <div style={{ marginBottom: '15px', backgroundColor: '#f0f4f8', padding: '10px', borderRadius: '8px', border: '1px solid #d0dbe5' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#333' }}>
          👤 Usuario / Operador:
        </label>
        <input
          type="text"
          value={userEmail}
          onChange={handleUserChange}
          placeholder="Nombre o Correo"
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '14px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            boxSizing: 'border-box'
          }}
        />
      </div>

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
        disabled={loading || saving}
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
        onClick={handleSave}
        disabled={(!chassisNumber && !popIdNumber) || loading || saving}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '16px',
          backgroundColor: (chassisNumber || popIdNumber) && !saving ? '#28a745' : '#cccccc',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: (chassisNumber || popIdNumber) && !saving ? 'pointer' : 'not-allowed',
          marginTop: '20px'
        }}
      >
        {saving ? '⏳ Guardando...' : '💾 Confirmar y Guardar'}
      </button>
    </div>
  );
}