export function getReturnUrl() {
  const params = new URLSearchParams(window.location.search);
  const value = params.get("returnUrl");

  if (!value) return "";

  try {
    const url = new URL(value);
    return url.toString();
  } catch {
    return "";
  }
}

export function sendCurrentToPowerApps({
  returnUrl,
  chassis,
  popid,
}) {
  if (!chassis && !popid) {
    return {
      ok: false,
      message: "No hay datos para enviar.",
    };
  }

  if (!returnUrl) {
    return {
      ok: false,
      message:
        "No se encontro returnUrl. Abre esta app desde Power Apps para usar este boton.",
    };
  }

  try {
    const url = new URL(returnUrl);

    url.searchParams.set("chasis", chassis || "");
    url.searchParams.set("popid", popid || "");

    window.location.assign(url.toString());

    return {
      ok: true,
      message: "Enviando datos a Power Apps...",
    };
  } catch (error) {
    console.error("Error enviando a Power Apps:", error);

    return {
      ok: false,
      message: "No fue posible construir la URL de retorno de Power Apps.",
    };
  }
}
