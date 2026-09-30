export async function shareRecords(records) {

  if (!records.length) {

    return {
      ok: false,
      message:
        "No hay registros para compartir.",
    };
  }


  const texto = records
    .map((record) => {

      const fecha =
        new Date(record.fecha)
          .toLocaleString("es-CL");

      return (
        `${record.chassis || ""}\t` +
        `${record.popid || ""}\t` +
        `${fecha}`
      );

    })
    .join("\n");


  const contenido =
    `Registro de camiones Scania\n\n` +
    `Total: ${records.length}\n\n` +
    `Chassis\tPopID\tFecha/Hora\n` +
    texto;


  // -----------------------------
  // Intentar menú nativo
  // -----------------------------

  if (typeof navigator.share === "function") {

    try {

      await navigator.share({
        title:
          "Registro de camiones Scania",

        text:
          contenido,
      });


      return {
        ok: true,
        message:
          "Menú de compartir abierto.",
      };

    } catch (error) {

      if (error?.name === "AbortError") {

        return {
          ok: false,
          message:
            "Compartir cancelado.",
        };
      }

      console.error(
        "Error al compartir:",
        error
      );

      return {
        ok: false,
        message:
          "No fue posible abrir el menú de compartir.",
      };
    }
  }


  // -----------------------------
  // No compatible
  // -----------------------------

  return {
    ok: false,
    message:
      "Este navegador no permite compartir directamente.",
  };
}