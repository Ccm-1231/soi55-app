import QRCode from "qrcode";

export async function generateQrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    margin: 0,
    color: { dark: "#17130f", light: "#00000000" },
    errorCorrectionLevel: "H",
  });
}
