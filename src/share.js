import { buildCsvFile } from "./export";

export async function shareRecords(records) {
  if (!records.length) {
    return {
      ok: false,
      method: "none",
      message: "No hay registros para compartir.",
    };
  }

  // ==========================================================
  // Crear archivo CSV
  // ==========================================================

  const file = buildCsvFile(records);

  // ==========================================================
  // Preparar texto de respaldo
  // ==========================================================

  const texto = records
    .map((record) => {
      const fecha = new Date(record.fecha)
        .toLocaleString("es-CL");

      return (
        `${record.chassis || ""}\t` +
        `${record.popid || ""}\t` +
        `${fecha}`
      );
    })
    .join("\n");

  const contenidoTexto =
    `Registro de camiones Scania\n\n` +
    `Total: ${records.length}\n\n` +
    `Chassis\tPopID\tFecha/Hora\n` +
    texto;

  // ==========================================================
  // Si el navegador soporta Web Share
  // ==========================================================

  if (typeof navigator.share === "function") {

    // --------------------------------------------------------
    // PRIMER INTENTO: compartir como archivo
    // --------------------------------------------------------

    if (typeof navigator.canShare === "function") {

      try {

        const shareFileData = {
          title: "Registro de camiones Scania",
          text: `${records.length} camiones registrados.`,
          files: [file],
        };

        const puedeCompartirArchivo =
          navigator.canShare(shareFileData);

        console.log(
          "Soporta compartir archivo:",
          puedeCompartirArchivo
        );

        if (puedeCompartirArchivo) {

          await navigator.share(
            shareFileData
          );

          return {
            ok: true,
            method: "file",
            message:
              "CSV compartido correctamente.",
          };
        }

      } catch (error) {

        if (error?.name === "AbortError") {

          return {
            ok: false,
            method: "cancelled",
            message:
              "Compartir cancelado.",
          };
        }

        console.warn(
          "No se pudo compartir como archivo:",
          error
        );

        // Continuamos con el metodo texto.
      }
    }

    // --------------------------------------------------------
    // SEGUNDO INTENTO: compartir como texto
    // --------------------------------------------------------

    try {

      await navigator.share({

        title:
          "Registro de camiones Scania",

        text:
          contenidoTexto,
      });

      return {
        ok: true,
        method: "text",
        message:
          "Registros compartidos como texto.",
      };

    } catch (error) {

      if (error?.name === "AbortError") {

        return {
          ok: false,
          method: "cancelled",
          message:
            "Compartir cancelado.",
        };
      }

      console.error(
        "Error compartiendo texto:",
        error
      );
    }
  }

  // ==========================================================
  // Si no existe Web Share
  // ==========================================================

  return {
    ok: false,
    method: "unsupported",
    message:
      "Este navegador no permite compartir desde la aplicacion.",
  };
}