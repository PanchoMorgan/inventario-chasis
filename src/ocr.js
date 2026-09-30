import Tesseract from "tesseract.js";

export async function extractNumbersFromImage(file, onProgress) {
  const imageUrl = URL.createObjectURL(file);

  try {
    const result = await Tesseract.recognize(imageUrl, "eng", {
      logger: (message) => {
        if (
          message.status === "recognizing text" &&
          typeof message.progress === "number"
        ) {
          onProgress?.(Math.round(message.progress * 100));
        }
      },
    });

    const text = result?.data?.text || "";
    console.log("Texto OCR:", text);

    const chassisMatches = text.match(/\b\d{7}\b/g) || [];
    const popMatches = text.match(/\b\d{6}\b/g) || [];

    return {
      text,
      chassis: chassisMatches[0] || "",
      popid: popMatches[0] || "",
    };
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}
