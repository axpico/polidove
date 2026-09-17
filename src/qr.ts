import qrcode from "qrcode-generator";

// Renders `text` as a QR code's dark/light module grid (rendered to SVG by ticket.ts).
export function buildQrModules(text: string): boolean[][] {
  const qr = qrcode(0, "M"); // type 0 = auto-size to fit the data, "M" = ~15% error correction
  qr.addData(text);
  qr.make();
  const size = qr.getModuleCount();
  const grid: boolean[][] = [];
  for (let row = 0; row < size; row++) {
    const line: boolean[] = [];
    for (let col = 0; col < size; col++) {
      line.push(qr.isDark(row, col));
    }
    grid.push(line);
  }
  return grid;
}
