const colors = {
  navy: "#041E42",
  primary: "#0066CC",
  background: "#F5F7FA",
  white: "#FFFFFF",
  text: "#172B4D",
  muted: "#667085",
  border: "#D9E0E8",
  secondary: "#3F4A54",
  danger: "#C62828",
};

export const styles = {
  page: {
    maxWidth: "420px",
    minHeight: "100vh",
    margin: "0 auto",
    padding: "24px 16px 40px",
    boxSizing: "border-box",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    backgroundColor: colors.background,
    color: colors.text,
  },

  header: {
    marginBottom: "24px",
    textAlign: "center",
  },

  date: {
    marginTop: "5px",
    fontSize: "14px",
    fontWeight: 500,
    color: colors.muted,
  },

  title: {
    margin: 0,
    textAlign: "center",
    fontSize: "24px",
    lineHeight: 1.25,
    fontWeight: 700,
    color: colors.navy,
  },

  // SECCIONES

  section: {
    marginTop: "26px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: 700,
    color: colors.navy,
  },

  sectionDivider: {
    height: "1px",
    marginTop: "8px",
    marginBottom: "14px",
    backgroundColor: colors.border,
  },

  // RESUMEN SUPERIOR

  summary: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    marginBottom: "2px",
    backgroundColor: colors.white,
    border: `1px solid ${colors.border}`,
    borderRadius: "12px",
  },

  summaryLabel: {
    fontSize: "14px",
    fontWeight: 600,
    color: colors.navy,
  },

  summaryValue: {
    marginLeft: "6px",
    fontSize: "16px",
    fontWeight: 700,
    color: colors.navy,
  },

  // NUEVO INVENTARIO

  newInventoryButton: {
    flexShrink: 0,
    padding: "9px 12px",
    border: `1px solid ${colors.primary}`,
    borderRadius: "8px",
    backgroundColor: colors.white,
    color: colors.primary,
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },

  // BOTONES PRINCIPALES

  primaryButton: {
    width: "100%",
    minHeight: "50px",
    padding: "12px 16px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: colors.primary,
    color: colors.white,
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,102,204,0.18)",
  },

  secondaryPrimaryButton: {
    width: "100%",
    minHeight: "50px",
    padding: "12px 16px",
    marginTop: "14px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: colors.primary,
    color: colors.white,
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,102,204,0.18)",
  },

  // TARJETA DE DATOS

  infoCard: {
    marginTop: "14px",
    padding: "16px",
    backgroundColor: colors.white,
    border: `1px solid ${colors.border}`,
    borderRadius: "12px",
    boxSizing: "border-box",
  },

  fieldBlock: {
    marginTop: 0,
  },

  fieldBlockSpaced: {
    marginTop: "14px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    fontSize: "14px",
    lineHeight: 1.4,
    fontWeight: 600,
    color: colors.navy,
  },

  chassisInput: {
    width: "100%",
    height: "52px",
    padding: "10px 14px",
    boxSizing: "border-box",
    border: `1px solid ${colors.border}`,
    borderRadius: "10px",
    outline: "none",
    backgroundColor: colors.white,
    color: colors.navy,
    textAlign: "center",
    fontSize: "20px",
    fontWeight: 600,
    letterSpacing: "0.5px",
  },

  popInput: {
    width: "100%",
    height: "52px",
    padding: "10px 14px",
    boxSizing: "border-box",
    border: `1px solid ${colors.border}`,
    borderRadius: "10px",
    outline: "none",
    backgroundColor: colors.white,
    color: colors.navy,
    textAlign: "center",
    fontSize: "20px",
    fontWeight: 600,
    letterSpacing: "0.5px",
  },

  // FOTO

  preview: {
    display: "block",
    width: "100%",
    maxHeight: "190px",
    marginTop: "14px",
    marginBottom: "2px",
    objectFit: "contain",
    border: `1px solid ${colors.border}`,
    borderRadius: "10px",
    backgroundColor: colors.white,
  },

  // ACCIONES INVENTARIO

  actionRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "14px",
  },

  secondaryButton: {
    width: "100%",
    minHeight: "46px",
    padding: "10px 12px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: colors.secondary,
    color: colors.white,
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },

  // TABLA

  listHeader: {
    marginTop: "20px",
  },

  listTitle: {
    margin: "0 0 10px",
    fontSize: "17px",
    fontWeight: 700,
    color: colors.navy,
  },

  list: {
    overflow: "hidden",
    border: `1px solid ${colors.border}`,
    borderRadius: "12px",
    backgroundColor: colors.white,
  },

  listHeaderRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    padding: "10px 14px",
    backgroundColor: "#EEF2F6",
    borderBottom: `1px solid ${colors.border}`,
    fontSize: "12px",
    fontWeight: 700,
    color: colors.navy,
  },

  recordItem: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    alignItems: "center",
    padding: "11px 14px",
    fontSize: "14px",
    lineHeight: 1.4,
    color: colors.text,
  },

  recordChassis: {
    fontWeight: 600,
    color: colors.navy,
  },

  recordPop: {
    color: colors.text,
  },

  // ELIMINAR

  dangerButton: {
    width: "100%",
    minHeight: "46px",
    padding: "10px 14px",
    marginTop: "12px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: colors.danger,
    color: colors.white,
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
};