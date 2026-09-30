export async function shareRecords(records) {
  if (!records.length) {
    return {
      ok: false,
      message: "No hay registros para compartir.",
    };
  }

  console.log("=== PRUEBA SHARE ===");
  console.log("navigator.share:", typeof navigator.share);
  console.log("navigator.canShare:", typeof navigator.canShare);
  console.log("userAgent:", navigator.userAgent);

  // ==========================================================
  // Intento simple de Web Share
  // ==========================================================

  if (typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: "Registro Scania",
        text: "Prueba de compartir desde la app Scania",
      });

      return {
        ok: true,
        message: "✅ Se abrió el menú de compartir de Android.",
      };

    } catch (error) {
      console.error("ERROR SHARE:", error);

      return {
        ok: false,
        message:
          `Error del menú compartir: ${error.name || "desconocido"}`,
      };
    }
  }

  return {
    ok: false,
    message:
      "Chrome no expone navigator.share en esta sesión.",
  };
}