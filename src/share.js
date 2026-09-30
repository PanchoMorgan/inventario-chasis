export async function shareRecords(records) {

  if (!records.length) {
    return {
      ok: false,
      message: "No hay registros para compartir.",
    };
  }

  // ==========================================================
  // Construir texto con todos los registros
  // ==========================================================

  const encabezado =
    "REGISTRO DE CAMIONES SCANIA\n\n" +
    `Total de camiones: ${records.length}\n\n` +
    "Chassis\tPopID\tFecha/Hora\n";

  const filas = records
    .map((record) => {

      const fecha = new Date(
        record.fecha
      ).toLocaleString("es-CL");

      return (
        `${record.chassis || ""}\t` +
        `${record.popid || ""}\t` +
        `${fecha}`
      );

    })
    .join("\n");

  const contenido =
    encabezado + filas;


  // ==========================================================
  // Compartir mediante el menú nativo
  // ==========================================================

  if (
    typeof navigator.share !== "function"
  ) {

    return {
      ok: false,
      message:
        "Este navegador no permite compartir.",
    };
  }


  try {

    await navigator.share({

      title:
        "Registro de camiones Scania",

      text:
        contenido,
    });


    return {
      ok: true,
      method: "text",
      message:
        `✅ ${records.length} registros enviados al menú de compartir.`,
    };

  } catch (error) {

    console.error(
      "Error al compartir:",
      error
    );


    if (
      error?.name === "AbortError"
    ) {

      return {
        ok: false,
        message:
          "Compartir cancelado.",
      };
    }


    return {
      ok: false,
      message:
        `Error al compartir: ${error.name || "desconocido"}`,
    };
  }
}