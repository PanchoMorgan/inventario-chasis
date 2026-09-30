import { buildCsvFile } from "./export";

export async function shareRecords(records) {

  if (!records.length) {
    return {
      ok: false,
      message: "No hay registros para compartir.",
    };
  }


  // ==========================================================
  // Crear archivo CSV
  // ==========================================================

  const file =
    buildCsvFile(records);


  console.log(
    "Archivo:",
    file.name
  );

  console.log(
    "Tipo:",
    file.type
  );

  console.log(
    "Tamaño:",
    file.size
  );


  // ==========================================================
  // Verificar Web Share
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
        "Este navegador no soporta compartir archivos.",
    };
  }


  // ==========================================================
  // IMPORTANTE:
  //
  // Probar SOLO files.
  //
  // Sin title.
  // Sin text.
  // ==========================================================

  const shareData = {
    files: [file]
  };


  let supported = false;


  try {

    supported =
      navigator.canShare(
        shareData
      );

  } catch (error) {

    console.error(
      "Error canShare:",
      error
    );
  }


  console.log(
    "Puede compartir CSV:",
    supported
  );


  if (!supported) {

    return {
      ok: false,
      message:
        "El navegador no acepta este CSV para compartir.",
    };
  }


  // ==========================================================
  // Compartir SOLO archivo
  // ==========================================================

  try {

    await navigator.share({
      files: [file]
    });


    return {
      ok: true,
      method: "csv-file",
      message:
        "CSV enviado al menú de compartir.",
    };


  } catch (error) {

    console.error(
      "Error share:",
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
        `Error CSV: ${error.name || "desconocido"}`,
    };
  }
}