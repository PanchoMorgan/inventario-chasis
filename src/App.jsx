import React, { useEffect, useRef, useState } from "react";
import { extractNumbersFromImage } from "./ocr";
import {
  addRecord,
  clearRecords,
  getAllRecords,
} from "./storage";
import { buildCsvFile, downloadFile } from "./export";
import { shareRecords } from "./share";
import {
  getReturnUrl,
  sendCurrentToPowerApps,
} from "./powerApps";
import { styles } from "./styles";

export default function App() {
  const [image, setImage] = useState(null);
  const [chassisNumber, setChassisNumber] = useState("");
  const [popIdNumber, setPopIdNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState({
    message: "",
    type: "",
  });

  const [records, setRecords] = useState([]);
  const [returnUrl, setReturnUrl] = useState("");

  const fileInputRef = useRef(null);

  // ==========================================================
  // INICIO
  // ==========================================================

  useEffect(() => {
    const init = async () => {
      try {
        const savedRecords = await getAllRecords();

        savedRecords.sort(
          (a, b) =>
            new Date(a.fecha).getTime() -
            new Date(b.fecha).getTime()
        );

        setRecords(savedRecords);
      } catch (error) {
        console.error(error);

        setStatus({
          message: "No fue posible recuperar los registros guardados.",
          type: "error",
        });
      }

      const callback = getReturnUrl();

      if (callback) {
        setReturnUrl(callback);
      }
    };

    init();
  }, []);

  // ==========================================================
  // BORRADOR ACTUAL
  // ==========================================================

  useEffect(() => {
    const draft = {
      chassis: chassisNumber,
      popid: popIdNumber,
    };

    if (!chassisNumber && !popIdNumber) {
      localStorage.removeItem("scania_draft");
    } else {
      localStorage.setItem("scania_draft", JSON.stringify(draft));
    }
  }, [chassisNumber, popIdNumber]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("scania_draft");

      if (!raw) return;

      const draft = JSON.parse(raw);

      if (draft.chassis) setChassisNumber(draft.chassis);
      if (draft.popid) setPopIdNumber(draft.popid);

      if (draft.chassis || draft.popid) {
        setStatus({
          message: "Se recupero un registro que estaba pendiente.",
          type: "info",
        });
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  // ==========================================================
  // OCR
  // ==========================================================

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setImage(previewUrl);
    setLoading(true);
    setChassisNumber("");
    setPopIdNumber("");

    setStatus({
      message: "Procesando imagen con OCR...",
      type: "info",
    });

    try {
      const result = await extractNumbersFromImage(
        file,
        (progress) => {
          setStatus({
            message: `Analizando numeros... ${progress}%`,
            type: "info",
          });
        }
      );

      setChassisNumber(result.chassis);
      setPopIdNumber(result.popid);

      if (result.chassis || result.popid) {
        setStatus({
          message: "¡Datos detectados con exito!",
          type: "success",
        });
      } else {
        setStatus({
          message:
            "No se detectaron numeros claros. Ingresalos manualmente.",
          type: "warning",
        });
      }
    } catch (error) {
      console.error(error);

      setStatus({
        message: "Error al procesar la imagen.",
        type: "error",
      });
    } finally {
      setLoading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // ==========================================================
  // GUARDAR CAMION
  // ==========================================================

  const handleSaveRecord = async () => {
    const chassis = chassisNumber.trim();
    const popid = popIdNumber.trim();

    if (!chassis && !popid) {
      setStatus({
        message: "No hay datos para guardar.",
        type: "warning",
      });

      return;
    }

    const exists = records.some(
      (record) =>
        record.chassis === chassis &&
        record.popid === popid
    );

    if (exists) {
      setStatus({
        message: "⚠️ Este camion ya esta registrado.",
        type: "warning",
      });

      return;
    }

    const newRecord = {
      chassis,
      popid,
      fecha: new Date().toISOString(),
    };

    try {
      await addRecord(newRecord);

      setRecords((current) => [...current, newRecord]);

      setChassisNumber("");
      setPopIdNumber("");
      setImage(null);

      localStorage.removeItem("scania_draft");

      setStatus({
        message: `✅ Camion guardado. Total: ${records.length + 1}`,
        type: "success",
      });
    } catch (error) {
      console.error(error);

      setStatus({
        message: "No fue posible guardar el camion.",
        type: "error",
      });
    }
  };

  // ==========================================================
  // COMPARTIR
  // ==========================================================

  const handleShareRecords = async () => {
    const result = await shareRecords(records);

    setStatus({
      message: result.message,
      type: result.ok ? "success" : "warning",
    });
  };

  // ==========================================================
  // DESCARGAR
  // ==========================================================

  const handleDownloadCSV = () => {
    if (!records.length) {
      setStatus({
        message: "No hay registros para exportar.",
        type: "warning",
      });

      return;
    }

    const file = buildCsvFile(records);
    downloadFile(file);

    setStatus({
      message: `📄 CSV generado con ${records.length} camiones.`,
      type: "success",
    });
  };

  // ==========================================================
  // POWER APPS
  // ==========================================================

  const handleReturnToPowerApps = () => {
    const result = sendCurrentToPowerApps({
      returnUrl,
      chassis: chassisNumber,
      popid: popIdNumber,
    });

    setStatus({
      message: result.message,
      type: result.ok ? "success" : "warning",
    });
  };

  // ==========================================================
  // BORRAR
  // ==========================================================

  const handleClearRecords = async () => {
    const ok = window.confirm(
      `¿Seguro que quieres borrar los ${records.length} registros?`
    );

    if (!ok) return;

    try {
      await clearRecords();

      setRecords([]);
      localStorage.removeItem("scania_draft");

      setStatus({
        message: "Todos los registros fueron eliminados.",
        type: "info",
      });
    } catch (error) {
      console.error(error);

      setStatus({
        message: "No fue posible borrar los registros.",
        type: "error",
      });
    }
  };

  const statusColor = {
    success: "#28a745",
    warning: "#d97706",
    error: "#dc3545",
    info: "#0066cc",
  }[status.type] || "#1a1a1a";

  // ==========================================================
  // UI
  // ==========================================================

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
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        style={{
          ...styles.primaryButton,
          opacity: loading ? 0.6 : 1,
        }}
      >
        📷 Tomar Foto al Parabrisas
      </button>

      {image && (
        <div
          style={{
            textAlign: "center",
            marginBottom: "15px",
          }}
        >
          <img
            src={image}
            alt="Captura"
            style={styles.preview}
          />
        </div>
      )}

      {status.message && (
        <p
          style={{
            textAlign: "center",
            fontWeight: "bold",
            color: statusColor,
            fontSize: "14px",
            padding: "0 5px",
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
          Numero de Chassis (7 digitos):
        </label>

        <input
          type="text"
          inputMode="numeric"
          value={chassisNumber}
          onChange={(event) =>
            setChassisNumber(
              event.target.value
                .replace(/\D/g, "")
                .slice(0, 7)
            )
          }
          placeholder="Ej: 4106630"
          style={styles.chassisInput}
        />
      </div>

      <div style={styles.fieldBlock}>
        <label
          style={{
            ...styles.label,
            color: "#555",
          }}
        >
          Pop ID (6 digitos):
        </label>

        <input
          type="text"
          inputMode="numeric"
          value={popIdNumber}
          onChange={(event) =>
            setPopIdNumber(
              event.target.value
                .replace(/\D/g, "")
                .slice(0, 6)
            )
          }
          placeholder="Ej: 756998"
          style={styles.popInput}
        />
      </div>

      <button
        type="button"
        onClick={handleSaveRecord}
        disabled={
          (!chassisNumber && !popIdNumber) || loading
        }
        style={{
          ...styles.greenButton,
          opacity:
            (!chassisNumber && !popIdNumber) || loading
              ? 0.5
              : 1,
        }}
      >
        ✅ GUARDAR CAMION
      </button>

      <button
        type="button"
        onClick={handleReturnToPowerApps}
        disabled={
          (!chassisNumber && !popIdNumber) || loading
        }
        style={{
          ...styles.secondaryButton,
          opacity:
            (!chassisNumber && !popIdNumber) || loading
              ? 0.5
              : 1,
        }}
      >
        ↗️ Enviar actual a Power Apps
      </button>

      <button
        type="button"
        onClick={handleShareRecords}
        disabled={records.length === 0}
        style={{
          ...styles.darkButton,
          opacity: records.length === 0 ? 0.5 : 1,
        }}
      >
        📤 COMPARTIR REGISTROS ({records.length})
      </button>

      <button
        type="button"
        onClick={handleDownloadCSV}
        disabled={records.length === 0}
        style={{
          ...styles.secondaryButton,
          opacity: records.length === 0 ? 0.5 : 1,
        }}
      >
        📥 DESCARGAR CSV ({records.length})
      </button>

      {records.length > 0 && (
        <div style={styles.listHeader}>
          <h3 style={{ fontSize: "16px" }}>
            Registros de esta sesion
          </h3>

          <div style={styles.list}>
            {records.map((record, index) => (
              <div
                key={
                  record.id ||
                  `${record.chassis}-${record.popid}-${index}`
                }
                style={{
                  ...styles.recordItem,
                  borderBottom:
                    index < records.length - 1
                      ? "1px solid #eee"
                      : "none",
                }}
              >
                <strong>
                  {index + 1}. {record.chassis || "-"}
                </strong>

                <div
                  style={{
                    color: "#666",
                    fontSize: "12px",
                    marginTop: "3px",
                  }}
                >
                  POP: {record.popid || "-"}
                </div>

                <div
                  style={{
                    color: "#999",
                    fontSize: "11px",
                    marginTop: "2px",
                  }}
                >
                  {new Date(record.fecha).toLocaleString(
                    "es-CL"
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleClearRecords}
            style={styles.dangerButton}
          >
            🗑️ BORRAR TODOS LOS REGISTROS
          </button>
        </div>
      )}
    </div>
  );
}
