export function recordsToCSV(records) {
  const header = "Chassis,PopID,Fecha\n";

  const rows = records.map((record) => {
    const fecha = new Date(record.fecha).toLocaleString("es-CL");

    return [
      csvEscape(record.chassis || ""),
      csvEscape(record.popid || ""),
      csvEscape(fecha),
    ].join(",");
  });

  return header + rows.join("\n");
}

function csvEscape(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function buildCsvFile(records) {
  const csv = recordsToCSV(records);
  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const filename = `SCANIA_PATIO_${formatDateForFilename(new Date())}_${records.length}_camiones.csv`;

  return new File([blob], filename, {
    type: "text/csv;charset=utf-8;",
  });
}

export function downloadFile(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = url;
  link.download = file.name;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatDateForFilename(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
