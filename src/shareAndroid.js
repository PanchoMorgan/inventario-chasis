import { buildCsvFile, downloadFile } from "./export";

export async function shareAndroid(records) {
  if (!records?.length) {
    return {
      ok: false,
      message: "No hay registros para compartir.",
    };
  }

  const file = buildCsvFile(records);

  // Intentar compartir CSV directamente
  if (
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function"
  ) {
    try {
      const data = { files: [file] };

      if (navigator.canShare(data)) {
        await navigator.share(data);

        return {
          ok: true,
          method: "android-file",
          message: "CSV compartido correctamente.",
        };
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        return {
          ok: false,
          method: "cancelled",
          message: "Compartir cancelado.",
        };
      }

      console.error("Error compartiendo CSV:", error);
    }
  }

  // Android: si no permite compartir archivo, descargarlo
  try {
    downloadFile(file);

    return {
      ok: true,
      method: "download-android",
      message:
        "CSV descargado. Puedes compartirlo desde Descargas.",
    };
  } catch (error) {
    console.error("Error descargando CSV:", error);

    return {
      ok: false,
      method: "error",
      message: "No fue posible compartir ni descargar el CSV.",
    };
  }
}