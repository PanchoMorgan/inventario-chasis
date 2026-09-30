import { buildCsvFile } from "./export";

export async function shareRecords(records) {
  if (!records.length) {
    return {
      ok: false,
      message: "No hay registros para compartir.",
    };
  }

  // ==========================================================
  // Crear el CSV
  // ==========================================================

  const file = buildCsvFile(records);

  // ==========================================================
  // Verificar si el navegador soporta compartir archivos
  // ==========================================================

  if (
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function"
  ) {
    const shareData = {
      title: "Registro de camiones Scania",
      text: `${records.length} camiones registrados.`,
      files: [file],
    };

    try {
      const puedeCompartirArchivo =
        navigator.canShare(shareData);

      console.log(
        "¿Puede compartir archivo?",
        puedeCompartirArchivo
      );

      if (puedeCompartirArchivo) {
        await navigator.share(shareData);

        return {
          ok: true,
          method: "file-share",
          message:
            "Archivo CSV enviado mediante el menu de compartir.",
        };
      }

      console.log(
        "Este navegador no permite compartir archivos mediante Web Share."
      );

    } catch (error) {

      if (error?.name === "AbortError") {
        return {
          ok: false,
          method: "cancelled",
          message: "Compartir cancelado.",
        };
      }

      console.error(
        "Error compartiendo archivo:",
        error
      );
    }
  }

  // ==========================================================
  // NO hacemos fallback automatico a texto.
  // ==========================================================

  return {
    ok: false,
    method: "unsupported",
    message:
      "Este telefono/navegador no permite compartir archivos CSV directamente desde la web.",
  };
}