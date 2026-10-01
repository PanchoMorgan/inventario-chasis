import React, { useEffect, useRef, useState } from "react";
import { extractNumbersFromImage } from "./ocr";
import { addRecord, clearRecords, getAllRecords } from "./storage";
import { buildCsvFile, downloadFile } from "./export";
import { shareRecords } from "./share";
import { styles } from "./styles";

const isAndroid = /Android/i.test(navigator.userAgent);
const fechaActual = new Date().toLocaleDateString("es-CL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default function App() {
  const [image, setImage] = useState(null);
  const [chassisNumber, setChassisNumber] = useState("");
  const [popIdNumber, setPopIdNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [showNewInventory, setShowNewInventory] = useState(false);

  const [scanStatus, setScanStatus] = useState({
    message: "",
    type: "",
  });

  const [inventoryStatus, setInventoryStatus] = useState({
    message: "",
    type: "",
  });

  const fileInputRef = useRef(null);

  const scanStatusColor =
    {
      success: "#18864B",
      warning: "#D97706",
      error: "#C62828",
      info: "#0066CC",
    }[scanStatus.type] || "#172B4D";

  const inventoryStatusColor =
    {
      success: "#18864B",
      warning: "#D97706",
      error: "#C62828",
      info: "#0066CC",
    }[inventoryStatus.type] || "#172B4D";

  // ==========================================================
  // CARGAR REGISTROS
  // ==========================================================

  useEffect(() => {
    getAllRecords()
      .then((saved) => {
        saved.sort(
          (a, b) => new Date(a.fecha) - new Date(b.fecha)
        );

        setRecords(saved);

        if (saved.length > 0) {
          setShowNewInventory(true);
        }
      })
      .catch((error) => {
        console.error(error);

        setScanStatus({
          message: "Error recuperando registros.",
          type: "error",
        });
      });

    try {
      const draft = JSON.parse(
        localStorage.getItem("scania_draft") || "null"
      );

      if (draft?.chassis) {
        setChassisNumber(draft.chassis);
      }

      if (draft?.popid) {
        setPopIdNumber(draft.popid);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  // ==========================================================
  // GUARDAR BORRADOR
  // ==========================================================

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

  // ==========================================================
  // NUEVO INVENTARIO
  // ==========================================================

  const handleNewInventory = async () => {
    const confirmed = window.confirm(
      `Se eliminarán los ${records.length} registros del inventario actual. ¿Deseas iniciar un nuevo inventario?`
    );

    if (!confirmed) return;

    try {
      await clearRecords();

      setRecords([]);
      setChassisNumber("");
      setPopIdNumber("");
      setImage(null);
      setShowNewInventory(false);

      localStorage.removeItem("scania_draft");

      setScanStatus({
        message: "Nuevo inventario iniciado.",
        type: "success",
      });

      setInventoryStatus({
        message: "",
        type: "",
      });
    } catch (error) {
      console.error(error);

      setScanStatus({
        message: "No fue posible iniciar un nuevo inventario.",
        type: "error",
      });
    }
  };

  // ==========================================================
  // FOTO + OCR
  // ==========================================================

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setImage(URL.createObjectURL(file));
    setLoading(true);
    setChassisNumber("");
    setPopIdNumber("");

    setScanStatus({
      message: "Procesando imagen...",
      type: "info",
    });

    try {
      const result = await extractNumbersFromImage(
        file,
        (progress) => {
          setScanStatus({
            message: `Analizando... ${progress}%`,
            type: "info",
          });
        }
      );

      setChassisNumber(result.chassis);
      setPopIdNumber(result.popid);

      if (result.chassis || result.popid) {
        setScanStatus({
          message: "Datos detectados.",
          type: "success",
        });
      } else {
        setScanStatus({
          message:
            "No se detectaron números. Puedes ingresarlos manualmente.",
          type: "warning",
        });
      }
    } catch (error) {
      console.error(error);

      setScanStatus({
        message: "Error procesando imagen.",
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
  // REGISTRAR CAMIÓN
  // ==========================================================

  const handleSave = async () => {
    const chassis = chassisNumber.trim();
    const popid = popIdNumber.trim();

    if (!chassis && !popid) {
      setScanStatus({
        message: "Ingresa al menos un dato antes de registrar.",
        type: "warning",
      });

      return;
    }

    // Duplicado si se repite Chasis o POP ID
    const exists = records.some(
      (record) =>
        (chassis && record.chassis === chassis) ||
        (popid && record.popid === popid)
    );

    if (exists) {
      setScanStatus({
        message: "Este Chasis o POP ID ya fue registrado.",
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

      setRecords((current) => [...current, record]);

      setChassisNumber("");
      setPopIdNumber("");
      setImage(null);

      localStorage.removeItem("scania_draft");

      setScanStatus({
        message: `Camión Registrado. Total: ${records.length + 1}`,
        type: "success",
      });
    } catch (error) {
      console.error(error);

      setScanStatus({
        message: "Error guardando el camión.",
        type: "error",
      });
    }
  };

  // ==========================================================
  // COMPARTIR
  // ==========================================================

  const handleShare = async () => {
    const result = await shareRecords(records);

    setInventoryStatus({
      message: result.message,
      type: result.ok ? "success" : "warning",
    });
  };

  // ==========================================================
  // DESCARGAR
  // ==========================================================

  const handleDownload = () => {
    if (!records.length) return;

    downloadFile(buildCsvFile(records));

    setInventoryStatus({
      message: `Archivo generado con ${records.length} camiones.`,
      type: "success",
    });
  };

  // ==========================================================
  // ELIMINAR
  // ==========================================================

  const handleClear = async () => {
    const confirmed = window.confirm(
      `¿Eliminar los ${records.length} registros?`
    );

    if (!confirmed) return;

    try {
      await clearRecords();

      setRecords([]);
      setChassisNumber("");
      setPopIdNumber("");
      setImage(null);
      setShowNewInventory(false);

      localStorage.removeItem("scania_draft");

      setScanStatus({
        message: "",
        type: "",
      });

      setInventoryStatus({
        message: "Registros eliminados.",
        type: "success",
      });
    } catch (error) {
      console.error(error);

      setInventoryStatus({
        message: "Error eliminando registros.",
        type: "error",
      });
    }
  };

  // ==========================================================
  // INTERFAZ
  // ==========================================================

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          Registro de Inventario
        </h1>

        <div style={styles.date}>
          {fechaActual}
        </div>
      </div>

      {/* RESUMEN */}

      <div style={styles.summary}>
        <div style={styles.summaryLabel}>
          Camiones Registrados:
          <span style={styles.summaryValue}>
            {records.length}
          </span>
        </div>

        {showNewInventory && records.length > 0 && (
          <button
            onClick={handleNewInventory}
            style={styles.newInventoryButton}
          >
            Nuevo Inventario
          </button>
        )}
      </div>

      {/* ======================================================
          ESCANEAR
      ======================================================= */}

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Escanear
        </h2>

        <div style={styles.sectionDivider} />

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
          Escanear Camión
        </button>

        {image && (
          <img
            src={image}
            alt="Captura del vehículo"
            style={styles.preview}
          />
        )}

        {scanStatus.message && (
          <p
            style={{
              margin: "10px 0 0",
              textAlign: "center",
              fontWeight: 600,
              color: scanStatusColor,
              fontSize: "14px",
            }}
          >
            {scanStatus.message}
          </p>
        )}

        <div style={styles.infoCard}>
          <div style={styles.fieldBlock}>
            <label style={styles.label}>
              Número de Chasis
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
              style={styles.chassisInput}
            />
          </div>

          <div style={styles.fieldBlockSpaced}>
            <label style={styles.label}>
              POP ID
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
              style={styles.popInput}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={
              (!chassisNumber && !popIdNumber) ||
              loading
            }
            style={styles.secondaryPrimaryButton}
          >
            Registrar Camión
          </button>
        </div>
      </section>

      {/* ======================================================
          INVENTARIO
      ======================================================= */}

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Inventario
        </h2>

        <div style={styles.sectionDivider} />

        <div style={styles.actionRow}>
          {!isAndroid && (
            <button
              onClick={handleShare}
              disabled={!records.length}
              style={styles.secondaryButton}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" />
                <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
              </svg>

              Compartir
            </button>
          )}

          <button
            onClick={handleDownload}
            disabled={!records.length}
            style={styles.secondaryButton}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>

            Descargar
          </button>
        </div>

        {/* Mensaje del bloque Inventario */}

        {inventoryStatus.message && (
          <p
            style={{
              margin: "10px 0 0",
              textAlign: "center",
              fontWeight: 600,
              color: inventoryStatusColor,
              fontSize: "14px",
            }}
          >
            {inventoryStatus.message}
          </p>
        )}

        {/* TABLA */}

        {records.length > 0 && (
          <>
            <div style={styles.listHeader}>
              <h3 style={styles.listTitle}>
                Camiones Registrados
              </h3>

              <div style={styles.list}>
                <div style={styles.listHeaderRow}>
                  <div>Chasis</div>
                  <div>POP ID</div>
                </div>

                {records.map((record, index) => (
                  <div
                    key={`${record.chassis}-${record.popid}-${index}`}
                    style={{
                      ...styles.recordItem,
                      borderBottom:
                        index < records.length - 1
                          ? "1px solid #D9E0E8"
                          : "none",
                    }}
                  >
                    <div style={styles.recordChassis}>
                      {record.chassis || "-"}
                    </div>

                    <div style={styles.recordPop}>
                      {record.popid || "-"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleClear}
              style={styles.dangerButton}
            >
              Eliminar Todos los Registros
            </button>
          </>
        )}
      </section>
    </div>
  );
}