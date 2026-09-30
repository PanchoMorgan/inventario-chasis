import { buildCsvFile } from "./export";

export async function shareRecords(records) {

  if (!records.length) {
    return {
      ok: false,
      message: "No hay registros para compartir.",
    };
  }

  // ==========================================================
  // Crear CSV
  // ==========================================================

  const file = buildCsvFile(records);

  console.log("=== PRUEBA DE COMPARTIR CSV ===");
  console.log("Archivo:", file.name);
  console.log("Tipo:", file.type);
  console.log("Tamaño:", file.size);

  console.log(
    "navigator.share:",
    typeof navigator.share
  );

  console.log(
    "navigator.canShare:",
    typeof navigator.canShare
  );


  // ==========================================================
  // Verificar soporte de compartir archivos
  // ==========================================================

  if (
    typeof navigator.share !== "function"
  ) {
    return {
      ok: false,
      message:
        "Este navegador no soporta compartir.",
    };
  }


  if (
    typeof navigator.canShare !== "function"
  ) {
    return {
      ok: false,
      message:
        "Este navegador no permite comprobar archivos compartibles.",
    };
  }


  const shareData = {
    title:
      "Registro de camiones Scania",

    text:
      `${records.length} camiones registrados.`,

    files: [
      file
    ],
  };


  // ==========================================================
  // Comprobar si el archivo puede compartirse
  // ==========================================================

  let puedeCompartirArchivo = false;


  try {

    puedeCompartirArchivo =
      navigator.canShare(
        shareData
      );

  } catch (error) {

    console.error(
      "Error en canShare:",
      error
    );

    return {
      ok: false,
      message:
        "El navegador no pudo comprobar si puede compartir el CSV.",
    };
  }


  console.log(
    "Puede compartir CSV:",
    puedeCompartirArchivo
  );


  // ==========================================================
  // COMPARTIR CSV
  // ==========================================================

  if (puedeCompartirArchivo) {

    try {

      await navigator.share(
        shareData
      );


      return {
        ok: true,
        method: "csv",
        message:
          "✅ CSV enviado al menú de compartir.",
      };

    } catch (error) {

      console.error(
        "Error compartiendo CSV:",
        error
      );


      if (
        error?.name === "AbortError"
      ) {

        return {
          ok: false,
          method: "cancelled",
          message:
            "Compartir cancelado.",
        };
      }


      return {
        ok: false,
        method: "share-error",
        message:
          `Error al compartir CSV: ${error.name || "desconocido"}`,
      };
    }
  }


  // ==========================================================
  // EL NAVEGADOR NO ACEPTA ARCHIVOS
  // ==========================================================

  return {
    ok: false,
    method: "unsupported-file",
    message:
      "El navegador permite compartir texto, pero no permite compartir archivos CSV desde esta aplicación.",
  };
}