import Tesseract from "tesseract.js";

export async function extractNumbersFromImage(file, onProgress) {
  const imageUrl = URL.createObjectURL(file);

  try {
    const { data: { text } } = await Tesseract.recognize(
      imageUrl,
      "eng",
      {
        logger: (m) => {
          if (
            m.status === "recognizing text" &&
            typeof m.progress === "number"
          ) {
            onProgress?.(Math.round(m.progress * 100));
          }
        },
      }
    );

    console.log("Texto OCR:", text);

    // Chassis = 7 dígitos
    const chassisMatches = text.match(/\b\d{7}\b/g) || [];

    // PopID = 6 dígitos
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