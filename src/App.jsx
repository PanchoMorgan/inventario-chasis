import React, { useEffect, useRef, useState } from "react";
import { extractNumbersFromImage } from "./ocr";
import { addRecord, clearRecords, getAllRecords } from "./storage";
import { buildCsvFile, downloadFile } from "./export";
import { shareRecords } from "./share";
import { styles } from "./styles";

const isAndroid = /Android/i.test(navigator.userAgent);

export default function App() {
  const [image, setImage] = useState(null);
  const [chassisNumber, setChassisNumber] = useState("");
  const [popIdNumber, setPopIdNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState({ message: "", type: "" });
  const fileInputRef = useRef(null);

  const statusColor = {
    success: "#28a745",
    warning: "#d97706",
    error: "#dc3545",
    info: "#0066cc",
  }[status.type] || "#1a1a1a";

  useEffect(() => {
    getAllRecords()
      .then(saved => {
        saved.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        setRecords(saved);
      })
      .catch(error => {
        console.error(error);
        setStatus({
          message: "Error recuperando registros.",
          type: "error",
        });
      });

    try {
      const draft = JSON.parse(
        localStorage.getItem("scania_draft") || "null"
      );

      if (draft?.chassis) setChassisNumber(draft.chassis);
      if (draft?.popid) setPopIdNumber(draft.popid);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (!chassisNumber && !popIdNumber) {
      localStorage.removeItem("scania_draft");
      return;
    }

    localStorage.setItem(
      "scania_draft",
      JSON.stringify({
        chassis: chassisNumber,
        popid: popIdNumber,
      })
    );
  }, [chassisNumber, popIdNumber]);

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImage(URL.createObjectURL(file));
    setLoading(true);
    setChassisNumber("");
    setPopIdNumber("");
    setStatus({
      message: "Procesando imagen...",
      type: "info",
    });

    try {
      const result = await extractNumbersFromImage(file, progress => {
        setStatus({
          message: `Analizando... ${progress}%`,
          type: "info",
        });
      });

      setChassisNumber(result.chassis);
      setPopIdNumber(result.popid);

      setStatus({
        message:
          result.chassis || result.popid
            ? "Datos detectados."
            : "No se detectaron numeros. Puedes ingresarlos manualmente.",
        type:
          result.chassis || result.popid
            ? "success"
            : "warning",
      });
    } catch (error) {
      console.error(error);
      setStatus({
        message: "Error procesando imagen.",
        type: "error",
      });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    const chassis = chassisNumber.trim();
    const popid = popIdNumber.trim();

    if (!chassis && !popid) return;

    if (
      records.some(
        r => r.chassis === chassis && r.popid === popid
      )
    ) {
      setStatus({
        message: "Este camion ya esta registrado.",
        type: "warning",
      });
      return;
    }

    const record = {
      chassis,
      popid,
      fecha: new Date().toISOString(),
    };

    try {
      await addRecord(record);
      setRecords(current => [...current, record]);
      setChassisNumber("");
      setPopIdNumber("");
      setImage(null);
      localStorage.removeItem("scania_draft");

      setStatus({
        message: `Camion guardado. Total: ${records.length + 1}`,
        type: "success",
      });
    } catch (error) {
      console.error(error);
      setStatus({
        message: "Error guardando camion.",
        type: "error",
      });
    }
  };

  const handleShare = async () => {
    const result = await shareRecords(records);

    setStatus({
      message: result.message,
      type: result.ok ? "success" : "warning",
    });
  };

  const handleDownload = () => {
    if (!records.length) return;

    downloadFile(buildCsvFile(records));

    setStatus({
      message: `CSV generado con ${records.length} camiones.`,
      type: "success",
    });
  };

  const handleClear = async () => {
    if (!window.confirm(`¿Borrar los ${records.length} registros?`)) {
      return;
    }

    try {
      await clearRecords();
      setRecords([]);
      localStorage.removeItem("scania_draft");

      setStatus({
        message: "Registros eliminados.",
        type: "info",
      });
    } catch (error) {
      console.error(error);
      setStatus({
        message: "Error eliminando registros.",
        type: "error",
      });
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Escaner OCR Chasis</h2>

      <p style={styles.subtitle}>
        Registro de camiones
      </p>

      <div style={styles.counter}>
        <div style={styles.counterLabel}>
          CAMIONES GUARDADOS
        </div>

        <div style={styles.counterValue}>
          {records.length}
        </div>
      </div>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleImageUpload}
        style={{ display: "none" }}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        style={styles.primaryButton}
      >
        📷 Tomar Foto al Parabrisas
      </button>

      {image && (
        <img
          src={image}
          alt="Captura"
          style={styles.preview}
        />
      )}

      {status.message && (
        <p
          style={{
            textAlign: "center",
            fontWeight: "bold",
            color: statusColor,
            fontSize: "14px",
          }}
        >
          {status.message}
        </p>
      )}

      <div style={styles.fieldBlock}>
        <label
          style={{
            ...styles.label,
            color: "#0066cc",
          }}
        >
          Numero de Chassis
        </label>

        <input
          type="text"
          inputMode="numeric"
          value={chassisNumber}
          onChange={e =>
            setChassisNumber(
              e.target.value.replace(/\D/g, "").slice(0, 7)
            )
          }
          style={styles.chassisInput}
        />
      </div>

      <div style={styles.fieldBlock}>
        <label style={styles.label}>
          Pop ID
        </label>

        <input
          type="text"
          inputMode="numeric"
          value={popIdNumber}
          onChange={e =>
            setPopIdNumber(
              e.target.value.replace(/\D/g, "").slice(0, 6)
            )
          }
          style={styles.popInput}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={
          (!chassisNumber && !popIdNumber) || loading
        }
        style={styles.greenButton}
      >
        ✅ GUARDAR CAMION
      </button>

      {!isAndroid && (
        <button
          onClick={handleShare}
          disabled={!records.length}
          style={styles.darkButton}
        >
          📤 COMPARTIR REGISTROS ({records.length})
        </button>
      )}

      <button
        onClick={handleDownload}
        disabled={!records.length}
        style={styles.secondaryButton}
      >
        📥 DESCARGAR CSV ({records.length})
      </button>

      {records.length > 0 && (
        <div style={styles.listHeader}>
          <h3>Registros</h3>

          <div style={styles.list}>
            {records.map((record, index) => (
              <div
                key={`${record.chassis}-${record.popid}-${index}`}
                style={{
                  ...styles.recordItem,
                  borderBottom: "1px solid #eee",
                }}
              >
                <strong>
                  {index + 1}. {record.chassis}
                </strong>

                <div>
                  POP: {record.popid}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleClear}
            style={styles.dangerButton}
          >
            🗑️ BORRAR TODOS LOS REGISTROS
          </button>
        </div>
      )}
    </div>
  );
}