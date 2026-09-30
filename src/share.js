const testFile = new File(
  ["hola"],
  "prueba.txt",
  {
    type: "text/plain"
  }
);

console.log(
  "canShare TXT:",
  navigator.canShare({
    files: [testFile]
  })
);