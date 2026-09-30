import { buildCsvFile, downloadFile } from "./export";


export async function shareIOS(records) {

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
    "iOS - archivo:",
    file.name
  );

  console.log(
    "iOS - tipo:",
    file.type
  );

  console.log(
    "iOS - tamaño:",
    file.size
  );


  // ==========================================================
  // Comprobar Web Share
  // ==========================================================

  if (
    typeof navigator.share !== "function"
  ) {

    console.log(
      "iOS no dispone de navigator.share."
    );

    // Fallback: descargar

    try {

      downloadFile(file);

      return {
        ok: true,
        method: "download",
        message:
          "El CSV fue descargado.",
      };

    } catch (error) {

      console.error(error);

      return {
        ok: false,
        method: "error",
        message:
          "No fue posible compartir ni descargar el CSV.",
      };
    }
  }


  // ==========================================================
  // Comprobar si puede compartir archivo
  // ==========================================================

  if (
    typeof navigator.canShare === "function"
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
        "iOS - puede compartir archivo:",
        canShareFile
      );


      if (canShareFile) {

        await navigator.share({
          files: [file],
        });


        return {
          ok: true,
          method: "ios-file",
          message:
            "CSV compartido correctamente.",
        };
      }

    } catch (error) {

      console.error(
        "iOS - error compartiendo:",
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
  // Fallback iOS
  // ==========================================================

  try {

    downloadFile(file);

    return {
      ok: true,
      method: "download",
      message:
        "El CSV fue descargado.",
    };

  } catch (error) {

    console.error(error);

    return {
      ok: false,
      method: "error",
      message:
        "No fue posible compartir ni descargar el CSV.",
    };
  }
}