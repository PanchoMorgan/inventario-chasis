import { buildCsvFile, downloadFile } from "./export";

export async function shareAndroid(records) {

  if (!records || records.length === 0) {
    return {
      ok: false,
      method: "none",
      message: "No hay registros para compartir.",
    };
  }

  // ==========================================================
  // 1. Crear CSV
  // ==========================================================

  const file = buildCsvFile(records);

  console.log("Android - CSV:", file.name);


  // ==========================================================
  // 2. Descargar CSV
  // ==========================================================

  try {
    downloadFile(file);
  } catch (error) {
    console.error("Error descargando CSV:", error);

    return {
      ok: false,
      method: "download-error",
      message: "No fue posible descargar el CSV.",
    };
  }


  // ==========================================================
  // 3. Abrir selector de archivo
  //
  // IMPORTANTE:
  // El navegador no nos permite abrir directamente
  // el selector de archivos del sistema después
  // de una descarga.
  //
  // Por eso usamos un input tipo file.
  // ==========================================================

  return new Promise((resolve) => {

    const input =
      document.createElement("input");

    input.type = "file";
    input.accept = ".csv,text/csv";

    input.style.display = "none";

    document.body.appendChild(input);


    input.onchange = async (event) => {

      const selectedFile =
        event.target.files?.[0];


      input.remove();


      if (!selectedFile) {

        resolve({
          ok: false,
          method: "cancelled",
          message:
            "No se selecciono ningun archivo.",
        });

        return;
      }


      // ======================================================
      // 4. Intentar compartir el archivo seleccionado
      // ======================================================

      if (
        typeof navigator.share !== "function"
      ) {

        resolve({
          ok: false,
          method: "unsupported",
          message:
            "Este navegador no permite compartir archivos.",
        });

        return;
      }


      if (
        typeof navigator.canShare === "function"
      ) {

        try {

          const shareData = {
            files: [selectedFile],
          };


          const canShare =
            navigator.canShare(
              shareData
            );


          console.log(
            "Android - archivo seleccionado compartible:",
            canShare
          );


          if (!canShare) {

            resolve({
              ok: false,
              method: "unsupported-file",
              message:
                "El navegador no permite compartir este archivo.",
            });

            return;
          }


          await navigator.share({
            files: [selectedFile],
          });


          resolve({
            ok: true