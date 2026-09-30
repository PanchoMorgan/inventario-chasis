import React, { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';

const DB_NAME = 'ScaniaPatioDB';
const DB_VERSION = 1;
const STORE_NAME = 'registros';

// ============================================================
// IndexedDB
// ============================================================

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });

        store.createIndex('chassis', 'chassis', { unique: false });
        store.createIndex('popid', 'popid', { unique: false });
        store.createIndex('fecha', 'fecha', { unique: false });
      }
    };
  });
}

async function getAllRecords() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => reject(request.error);
  });
}

async function addRecord(record) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.add(record);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteAllRecords() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ============================================================
// App
// ============================================================

export default function App() {
  const [image, setImage] = useState(null);
  const [chassisNumber, setChassisNumber] = useState('');
  const [popIdNumber, setPopIdNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState({
    message: '',
    type: '',
  });

  const [returnUrl, setReturnUrl] = useState('');

  const [records, setRecords] = useState([]);

  const fileInputRef = useRef(null);

  // ==========================================================
  // Cargar datos guardados al abrir la app
  // ==========================================================

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedRecords = await getAllRecords();

        // Ordenar desde el más antiguo al más nuevo
        savedRecords.sort(
          (a, b) => new Date(a.fecha) - new Date(b.fecha)
        );

        setRecords(savedRecords);

        // Recuperar datos pendientes del registro actual
        const savedDraft = localStorage.getItem('scania_draft');

        if (savedDraft) {
          const draft = JSON.parse(savedDraft);

          if (draft.chassis) {
            setChassisNumber(draft.chassis);
          }

          if (draft.popid) {
            setPopIdNumber(draft.popid);
          }

          if (draft.chassis || draft.popid) {
            setStatus({
              message: 'Se recuperó un registro que estaba pendiente.',
              type: 'info',
            });
          }
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    };

    loadSavedData();

    // Capturar returnUrl
    const params = new URLSearchParams(window.location.search);
    const callback = params.get('returnUrl');

    if (callback && callback.startsWith('http')) {
      setReturnUrl(callback);
    }
  }, []);

  // ==========================================================
  // Guardar automáticamente el registro actual como borrador
  // ==========================================================

  useEffect(() => {
    const draft = {
      chassis: chassisNumber,
      popid: popIdNumber,
    };

    // Si no hay nada escrito, eliminamos el borrador
    if (!chassisNumber && !popIdNumber) {
      localStorage.removeItem('scania_draft');
      return;
    }

    localStorage.setItem('scania_draft', JSON.stringify(draft));
  }, [chassisNumber, popIdNumber]);

  // ==========================================================
  // OCR
  // ==========================================================

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    setImage(imageUrl);

    setStatus({
      message: 'Procesando imagen con OCR...',
      type: 'info',
    });

    setLoading(true);

    setChassisNumber('');
    setPopIdNumber('');

    try {
      const {
        data: { text },
      } = await Tesseract.recognize(imageUrl, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setStatus({
              message: `Analizando números... ${Math.round(
                m.progress * 100
              )}%`,
              type: 'info',
            });
          }
        },
      });

      console.log('Texto OCR:', text);

      // ======================================================
      // Extraer Chassis (7 dígitos)
      // ======================================================

      const chassisMatches = text.match(/\b\d{7}\b/g);

      // ======================================================
      // Extraer Pop ID (6 dígitos)
      // ======================================================

      const popMatches = text.match(/\b\d{6}\b/g);

      const detectedChassis =
        chassisMatches && chassisMatches.length > 0
          ? chassisMatches[0]
          : '';

      const detectedPop =
        popMatches && popMatches.length > 0
          ? popMatches[0]
          : '';

      if (detectedChassis) {
        setChassisNumber(detectedChassis);
      }

      if (detectedPop) {
        setPopIdNumber(detectedPop);
      }

      if (detectedChassis || detectedPop) {
        setStatus({
          message: '¡Datos detectados con éxito!',
          type: 'success',
        });
      } else {
        setStatus({
          message:
            'No se detectaron números claros. Ingrésalos manualmente.',
          type: 'warning',
        });
      }
    } catch (err) {
      console.error(err);

      setStatus({
        message: 'Error al procesar la imagen.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // Guardar camión localmente
  // ==========================================================

  const handleSaveRecord = async () => {
    const chassis = chassisNumber.trim();
    const popid = popIdNumber.trim();

    if (!chassis && !popid) {
      return;
    }

    try {
      // Evitar duplicados exactos
      const alreadyExists = records.some(
        (record) =>
          record.chassis === chassis &&
          record.popid === popid
      );

      if (alreadyExists) {
        setStatus({
          message: '⚠️ Este camión ya está registrado.',
          type: 'warning',
        });

        return;
      }

      const newRecord = {
        chassis,
        popid,
        fecha: new Date().toISOString(),
      };

      await addRecord(newRecord);

      const updatedRecords = [...records, newRecord];

      setRecords(updatedRecords);

      // Limpiar borrador
      localStorage.removeItem('scania_draft');

      // Limpiar campos
      setChassisNumber('');
      setPopIdNumber('');
      setImage(null);

      // Reiniciar selector de archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setStatus({
        message: `✅ Camión guardado. Total: ${updatedRecords.length}`,
        type: 'success',
      });
    } catch (error) {
      console.error('Error guardando registro:', error);

      setStatus({
        message: 'Error guardando el camión.',
        type: 'error',
      });
    }
  };

  // ==========================================================
  // Enviar actual a Power Apps
  // ==========================================================

  const handleReturnToPowerApps = () => {
    if (!chassisNumber && !popIdNumber) return;

    if (returnUrl && returnUrl.startsWith('http')) {
      const separator = returnUrl.includes('?') ? '&' : '?';

      const finalRedirect =
        `${returnUrl}${separator}` +
        `chasis=${encodeURIComponent(chassisNumber)}` +
        `&popid=${encodeURIComponent(popIdNumber)}`;

      window.location.href = finalRedirect;
    } else {
      const textoACopiar =
        `Chassis: ${chassisNumber} | PopID: ${popIdNumber}`;

      navigator.clipboard
        .writeText(textoACopiar)
        .then(() => {
          setStatus({
            message:
              '📋 ¡Códigos copiados! Pégalos donde quieras.',
            type: 'success',
          });
        })
        .catch(() => {
          alert(
            `Chassis: ${chassisNumber}\nPopID: ${popIdNumber}`
          );
        });
    }
  };

  // ==========================================================
  // Exportar CSV
  // ==========================================================

  const handleExportCSV = () => {
    if (records.length === 0) {
      setStatus({
        message: 'No hay registros para exportar.',
        type: 'warning',
      });

      return;
    }

    const header = 'Chassis,PopID,Fecha\n';

    const rows = records
      .map((record) => {
        const fecha = new Date(record.fecha).toLocaleString(
          'es-CL'
        );

        return `"${record.chassis}","${record.popid}","${fecha}"`;
      })
      .join('\n');

    const csv = header + rows;

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;

    const fechaArchivo = new Date()
      .toISOString()
      .slice(0, 10);

    link.download = `camiones_${fechaArchivo}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setStatus({
      message: `📄 CSV generado con ${records.length} camiones.`,
      type: 'success',
    });
  };

  // ==========================================================
  // Borrar todos los registros
  // ==========================================================

  const handleClearRecords = async () => {
    const confirmation = window.confirm(
      `¿Seguro que quieres borrar los ${records.length} registros guardados?`
    );

    if (!confirmation) return;

    try {
      await deleteAllRecords();

      setRecords([]);

      localStorage.removeItem('scania_draft');

      setStatus({
        message: 'Todos los registros fueron eliminados.',
        type: 'info',
      });
    } catch (error) {
      console.error(error);

      setStatus({
        message: 'Error al borrar los registros.',
        type: 'error',
      });
    }
  };

  // ==========================================================
  // Color estado
  // ==========================================================

  const getStatusColor = () => {
    switch (status.type) {
      case 'success':
        return '#28a745';

      case 'warning':
        return '#d97706';

      case 'error':
        return '#dc3545';

      case 'info':
        return '#0066cc';

      default:
        return '#1a1a1a';
    }
  };

  // ==========================================================
  // Render
  // ==========================================================

  return (
    <div
      style={{
        maxWidth: '400px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'sans-serif',
      }}
    >
      <h2
        style={{
          textAlign: 'center',
          color: '#1a1a1a',
          marginBottom: '4px',
        }}
      >
        Escáner OCR Chasis
      </h2>

      <p
        style={{
          textAlign: 'center',
          color: '#666',
          fontSize: '13px',
          marginTop: 0,
        }}
      >
        Registro de camiones
      </p>

      {/* =====================================================
          CONTADOR
      ====================================================== */}

      <div
        style={{
          backgroundColor: '#f1f5f9',
          borderRadius: '10px',
          padding: '12px',
          textAlign: 'center',
          marginBottom: '15px',
          border: '1px solid #ddd',
        }}
      >
        <div
          style={{
            fontSize: '13px',
            color: '#666',
          }}
        >
          CAMIONES GUARDADOS
        </div>

        <div
          style={{
            fontSize: '30px',
            fontWeight: 'bold',
            color: '#0066cc',
          }}
        >
          {records.length}
        </div>
      </div>

      {/* =====================================================
          FOTO
      ====================================================== */}

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
          marginTop: '10px',
        }}
      >
        📷 Tomar Foto al Parabrisas
      </button>

      {image && (
        <div
          style={{
            textAlign: 'center',
            marginBottom: '15px',
          }}
        >
          <img
            src={image}
            alt="Captura"
            style={{
              width: '100%',
              maxHeight: '180px',
              objectFit: 'contain',
              borderRadius: '8px',
              border: '1px solid #ccc',
            }}
          />
        </div>
      )}

      {/* =====================================================
          ESTADO
      ====================================================== */}

      {status.message && (
        <p
          style={{
            textAlign: 'center',
            fontWeight: 'bold',
            color: getStatusColor(),
            fontSize: '14px',
            padding: '0 5px',
          }}
        >
          {status.message}
        </p>
      )}

      {/* =====================================================
          CHASSIS
      ====================================================== */}

      <div style={{ marginTop: '15px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '5px',
            color: '#0066cc',
          }}
        >
          Número de Chassis (7 dígitos):
        </label>

        <input
          type="text"
          inputMode="numeric"
          value={chassisNumber}
          onChange={(e) =>
            setChassisNumber(
              e.target.value.replace(/\D/g, '').slice(0, 7)
            )
          }
          placeholder="Ej: 4106630"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '20px',
            textAlign: 'center',
            fontWeight: 'bold',
            borderRadius: '8px',
            border: '2px solid #0066cc',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* =====================================================
          POP ID
      ====================================================== */}

      <div style={{ marginTop: '15px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '5px',
            color: '#555',
          }}
        >
          Pop ID (6 dígitos):
        </label>

        <input
          type="text"
          inputMode="numeric"
          value={popIdNumber}
          onChange={(e) =>
            setPopIdNumber(
              e.target.value.replace(/\D/g, '').slice(0, 6)
            )
          }
          placeholder="Ej: 756998"
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '18px',
            textAlign: 'center',
            fontWeight: 'bold',
            borderRadius: '8px',
            border: '1.5px solid #ccc',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* =====================================================
          GUARDAR
      ====================================================== */}

      <button
        onClick={handleSaveRecord}
        disabled={
          (!chassisNumber && !popIdNumber) || loading
        }
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '16px',
          backgroundColor:
            (chassisNumber || popIdNumber) && !loading
              ? '#28a745'
              : '#cccccc',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor:
            (chassisNumber || popIdNumber) && !loading
              ? 'pointer'
              : 'not-allowed',
          marginTop: '20px',
        }}
      >
        ✅ GUARDAR CAMIÓN
      </button>

      {/* =====================================================
          POWER APPS
      ====================================================== */}

      <button
        onClick={handleReturnToPowerApps}
        disabled={
          (!chassisNumber && !popIdNumber) || loading
        }
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '14px',
          backgroundColor: '#f3f4f6',
          color: '#333',
          border: '1px solid #ccc',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer',
          marginTop: '10px',
        }}
      >
        ↗️ Enviar actual a Power Apps
      </button>

      {/* =====================================================
          EXPORTAR
      ====================================================== */}

      <button
        onClick={handleExportCSV}
        disabled={records.length === 0}
        style={{
          width: '100%',
          padding: '14px',
          fontSize: '15px',
          backgroundColor:
            records.length > 0 ? '#555' : '#cccccc',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor:
            records.length > 0 ? 'pointer' : 'not-allowed',
          marginTop: '15px',
        }}
      >
        📄 EXPORTAR CSV ({records.length})
      </button>

      {/* =====================================================
          LISTA
      ====================================================== */}

      {records.length > 0 && (
        <div
          style={{
            marginTop: '20px',
            borderTop: '1px solid #ddd',
            paddingTop: '15px',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              marginBottom: '10px',
            }}
          >
            Registros de esta sesión
          </h3>

          <div
            style={{
              maxHeight: '250px',
              overflowY: 'auto',
              border: '1px solid #ddd',
              borderRadius: '8px',
            }}
          >
            {records.map((record, index) => (
              <div
                key={record.id || `${record.chassis}-${index}`}
                style={{
                  padding: '10px',
                  borderBottom:
                    index < records.length - 1
                      ? '1px solid #eee'
                      : 'none',
                  fontSize: '14px',
                }}
              >
                <strong>
                  {index + 1}. {record.chassis || '-'}
                </strong>

                <div
                  style={{
                    color: '#666',
                    fontSize: '12px',
                    marginTop: '3px',
                  }}
                >
                  POP: {record.popid || '-'}
                </div>

                <div
                  style={{
                    color: '#999',
                    fontSize: '11px',
                    marginTop: '2px',
                  }}
                >
                  {new Date(record.fecha).toLocaleString(
                    'es-CL'
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* =================================================
              BORRAR
          ================================================== */}

          <button
            onClick={handleClearRecords}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '13px',
              backgroundColor: 'white',
              color: '#dc3545',
              border: '1px solid #dc3545',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '10px',
            }}
          >
            🗑️ BORRAR TODOS LOS REGISTROS
          </button>
        </div>
      )}
    </div>
  );
}