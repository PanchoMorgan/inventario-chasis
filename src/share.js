import { shareIOS } from "./shareIOS";
import { shareAndroid } from "./shareAndroid";

function detectPlatform() {
  const userAgent =
    navigator.userAgent ||
    navigator.vendor ||
    window.opera ||
    "";

  const isIOS =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (
      navigator.platform === "MacIntel" &&
      navigator.maxTouchPoints > 1
    );

  const isAndroid =
    /Android/i.test(userAgent);

  if (isIOS) {
    return "ios";
  }

  if (isAndroid) {
    return "android";
  }

  return "other";
}


export async function shareRecords(records) {

  if (!records || records.length === 0) {
    return {
      ok: false,
      method: "none",
      message:
        "No hay registros para compartir.",
    };
  }


  const platform =
    detectPlatform();


  console.log(
    "Plataforma detectada:",
    platform
  );


  // ==========================================================
  // iPhone / iPad
  // ==========================================================

  if (platform === "ios") {

    return await shareIOS(records);
  }


  // ==========================================================
  // Android
  // ==========================================================

  if (platform === "android") {

    return await shareAndroid(records);
  }


  // ==========================================================
  // Otros dispositivos
  // ==========================================================

  return await shareAndroid(records);
}