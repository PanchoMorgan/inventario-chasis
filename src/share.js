export async function shareRecords(records) {
  if (!records.length) {
    return {
      ok: false,
      message: "No hay registros para compartir.",
    };
  }

  // ==========================================================
  // PRUEBA 1: compartir texto simple
  // ==========================================================

  if (typeof navigator.share !== "function") {
    return {
      ok: false,
      message:
        "Este navegador no dispone de navigator.share.",
    };
  }

  try {
    await navigator.share({
      title: "Prueba Scania",
      text: "Prueba de compartir desde la app Scania.",
    });

    return {
      ok: true,
      method: "simple-text",
      message:
        "✅ El menu nativo de compartir funciona.",
    };

  } catch (error) {

    console.error("Share error:", error);

    return {
      ok: false,
      method: "error",
      message:
        `Error al compartir: ${error.name || "desconocido"}`,
    };
  }
}