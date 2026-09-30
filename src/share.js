import { buildCsvFile } from "./export";

export async function shareRecords(records) {
  if (!records.length) {
    return {
      ok: false,
      message: "No hay registros para compartir.",
    };
  }

  const file = buildCsvFile(records);

  // ==========================================================
  // Compartir archivo mediante el sistema nativo
  // ==========================================================

  if (
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function"
  ) {
    try {
      const shareData = {
        title: "Registro de camiones Scania",
        text: `${records.length} camiones registrados.`,
        files: [file],
      };

      console.log(
        "navigator.share:",
        typeof navigator.share
      );

      console.log(
        "navigator.canShare:",
        typeof navigator.canShare
      );

      console.log(
        "Puede compartir archivo:",
        navigator.canShare(shareData)
      );

      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);

        return {
          ok: true,
          method: "file",
          message: "CSV compartido correctamente.",
        };
      }

      return {
        ok: false,
        method: "unsupported-file",
        message:
          "Este navegador permite compartir, pero no archivos desde esta app.",
      };

    } catch (error) {
      console.error(
        "Error compartiendo archivo:",
        error
      );

      if (error?.name === "AbortError") {
        return {
          ok: false,
          method: "cancelled",
          message: "Compartir cancelado.",
        };
      }

      return {
        ok: false,
        method: "error",
        message:
          `Error al compartir: ${error.name || "desconocido"}`,
      };
    }
  }

  return {
    ok: false,
    method: "unsupported",
    message:
      "Este navegador no permite compartir archivos desde la aplicacion.",
  };
}