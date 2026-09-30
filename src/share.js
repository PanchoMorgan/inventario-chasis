import { buildCsvFile, downloadFile } from "./export";

export async function shareRecords(records) {
  // ==========================================================
  // VALIDACION
  // ==========================================================

  if (!records || records.length === 0) {
    return {
      ok: false,
      method: "none",
      message: "No hay registros para compartir.",
    };
  }

  // ==========================================================
  // CREAR ARCHIVO CSV
  // ==========================================================

  const file = buildCsvFile(records);

  console.log("=== COMPARTIR REGISTROS ===");
  console.log("Archivo:", file.name);
  console.log("Tipo:", file.type);
  console.log("Tamano:", file.size);
  console.log("Navegador:", navigator.userAgent);

  // ==========================================================
  // DETECTAR DISPOSITIVO
  // ==========================================================

  const userAgent =
    navigator.userAgent ||
    navigator.vendor ||
    window.opera ||
    "";

  const isIOS =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (
      navigator.platform === "MacIntel" &&
      navigator.maxTouchPoints > 1
    );

  const isAndroid =
    /Android/i.test(userAgent);

  console.log("iOS:", isIOS);
  console.log("Android:", isAndroid);

  // ==========================================================
  // COMPROBAR SOPORTE DE SHARE
  // ==========================================================

  const hasShare =
    typeof navigator.share === "function";

  const hasCanShare =
    typeof navigator.canShare === "function";

  console.log("navigator.share:", hasShare);
  console.log("navigator.canShare:", hasCanShare);

  // ==========================================================
  // INTENTAR COMPARTIR ARCHIVO
  // ==========================================================

  if (hasShare && hasCanShare) {
    try {
      const shareData = {
        files: [file],
      };

      const canShareFile =
        navigator.canShare(shareData);

      console.log(
        "Puede compartir archivo:",
        canShareFile
      );

      if (canShareFile) {
        await navigator.share({
          files: [file],
        });

        return {
          ok: true,
          method: "native-file-share",
          message:
            "CSV compartido correctamente.",
        };
      }

      console.log(
        "El navegador no permite compartir archivos."
      );

    } catch (error) {
      console.error(
        "Error compartiendo archivo:",
        error
      );

      // Si el usuario cancelo, no hacemos descarga.
      if (error?.name === "AbortError") {
        return {
          ok: false,
          method: "cancelled",
          message: "Compartir cancelado.",
        };
      }
    }
  }

  // ==========================================================
  // FALLBACK
  //
  // Como ya sabemos que Android no esta permitiendo
  // compartir archivos desde la web, descargamos el CSV.
  //
  // En iPhone, si llegamos aqui, tambien descargamos.
  // ==========================================================

  try {
    downloadFile(file);

    if (isAndroid) {
      return {
        ok: true,
        method: "download-android",
        message:
          "El navegador no permite compartir el CSV directamente. El archivo fue descargado; puedes compartirlo desde Descargas.",
      };
    }

    if (isIOS) {
      return {
        ok: true,
        method: "download-ios",
        message:
          "El archivo CSV fue descargado.",
      };
    }

    return {
      ok: true,
      method: "download",
      message:
        "El archivo CSV fue descargado.",
    };

  } catch (error) {
    console.error(
      "Error descargando CSV:",
      error
    );

    return {
      ok: false,
      method: "download-error",
      message:
        "No fue posible compartir ni descargar el CSV.",
    };
  }
}