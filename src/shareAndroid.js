import {
  buildCsvFile,
  downloadFile
} from "./export";


export async function shareAndroid(records) {

  if (!records || records.length === 0) {

    return {
      ok: false,
      method: "none",
      message:
        "No hay registros para compartir.",
    };
  }


  // ==========================================================
  // Crear CSV
  // ==========================================================

  const file =
    buildCsvFile(records);


  console.log(
    "Android - archivo:",
    file.name
  );

  console.log(
    "Android - tipo:",
    file.type
  );

  console.log(
    "Android - tamaño:",
    file.size
  );


  // ==========================================================
  // Verificar Web Share
  // ==========================================================

  const hasShare =
    typeof navigator.share === "function";

  const hasCanShare =
    typeof navigator.canShare === "function";


  console.log(
    "Android - navigator.share:",
    hasShare
  );

  console.log(
    "Android - navigator.canShare:",
    hasCanShare
  );


  // ==========================================================
  // Intentar compartir CSV
  // ==========================================================

  if (
    hasShare &&
    hasCanShare
  ) {

    try {

      const shareData = {
        files: [file],
      };


      const canShareFile =
        navigator.canShare(
          shareData
        );


      console.log(
        "Android - puede compartir archivo:",
        canShareFile
      );


      if (canShareFile) {

        await navigator.share({
          files: [file],
        });


        return {
          ok: true,
          method: "android-file",
          message:
            "CSV compartido correctamente.",
        };
      }

    } catch (error) {

      console.error(
        "Android - error compartiendo CSV:",
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
    }
  }


  // ==========================================================
  // FALLBACK ANDROID
  // ==========================================================

  try {

    downloadFile(file);


    return {
      ok: true,
      method: "download-android",
      message:
        "Android no permite compartir el CSV directamente desde la web. El archivo fue descargado; puedes compartirlo desde Descargas.",
    };


  } catch (error) {

    console.error(
      "Android - error descargando:",
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