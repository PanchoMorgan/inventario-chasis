import { buildCsvFile, downloadFile } from "./export";

export async function shareRecords(records) {
  if (!records.length) {
    return {
      ok: false,
      method: "none",
      message: "No hay registros para compartir.",
    };
  }

  const file = buildCsvFile(records);

  // Primero intenta compartir como archivo usando el menu nativo.
  if (
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function"
  ) {
    try {
      const data = {
        files: [file],
        title: "Registro de camiones Scania",
        text: `${records.length} camiones registrados.`,
      };

      if (navigator.canShare(data)) {
        await navigator.share(data);

        return {
          ok: true,
          method: "native-file-share",
          message: "Se abrio el menu de compartir.",
        };
      }
    } catch (error) {
      // Si el usuario cancelo el menu, no hacemos descarga automatica.
      if (error?.name === "AbortError") {
        return {
          ok: false,
          method: "cancelled",
          message: "Compartir cancelado.",
        };
      }
    }
  }

  // Segundo intento: compartir texto plano.
  if (typeof navigator.share === "function") {
    try {
      const text = records
        .map(
          (r) =>
            `${r.chassis || ""}\t${r.popid || ""}\t${new Date(
              r.fecha
            ).toLocaleString("es-CL")}`
        )
        .join("\n");

      await navigator.share({
        title: "Registro de camiones Scania",
        text,
      });

      return {
        ok: true,
        method: "native-text-share",
        message: "Se abrio el menu de compartir.",
      };
    } catch (error) {
      if (error?.name === "AbortError") {
        return {
          ok: false,
          method: "cancelled",
          message: "Compartir cancelado.",
        };
      }
    }
  }

  // Fallback final.
  downloadFile(file);

  return {
    ok: true,
    method: "download",
    message: "Este navegador no permite compartir archivos; se descargo el CSV.",
  };
}
