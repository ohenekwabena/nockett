import { describe, expect, it } from "vitest";
import { buildImagePdf, rotaCanvasSize } from "./schedule-image-export";

// A short stand-in for JPEG bytes — the builder treats the payload as opaque,
// so structural correctness doesn't depend on it being a real image.
const FAKE_JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0xff, 0xd9]);

function build() {
  return buildImagePdf({
    image: FAKE_JPEG,
    pxWidth: 1200,
    pxHeight: 640,
    pageWidth: 842,
    pageHeight: 595,
    draw: { x: 24, y: 60, width: 794, height: 423.5 },
  });
}

// latin1 maps each byte 1:1 to a char code, so string offsets == byte offsets.
function asLatin1(bytes: Uint8Array): string {
  return new TextDecoder("latin1").decode(bytes);
}

describe("buildImagePdf", () => {
  const pdf = build();
  const text = asLatin1(pdf);

  it("emits a well-formed PDF header and trailer", () => {
    expect(text.startsWith("%PDF-1.3")).toBe(true);
    expect(text).toContain("<< /Type /Catalog /Pages 2 0 R >>");
    expect(text).toContain("/Size 6 /Root 1 0 R");
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
  });

  it("embeds the image as a DCTDecode XObject with the exact byte length", () => {
    const match = text.match(/\/Filter \/DCTDecode \/Length (\d+) >>/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBe(FAKE_JPEG.length);
    expect(text).toContain("/MediaBox [0 0 842 595]");
    // The raw JPEG payload must survive verbatim inside the stream.
    expect(text).toContain(asLatin1(FAKE_JPEG));
  });

  it("writes an xref table whose offsets land on each object header", () => {
    const startxref = text.match(/startxref\n(\d+)\n%%EOF/);
    expect(startxref).not.toBeNull();
    const xrefStart = Number(startxref![1]);
    expect(text.slice(xrefStart, xrefStart + 4)).toBe("xref");

    const entriesBase = xrefStart + "xref\n0 6\n".length;
    for (let n = 1; n <= 5; n++) {
      const entry = text.substr(entriesBase + n * 20, 20);
      const objOffset = Number(entry.slice(0, 10));
      expect(text.slice(objOffset, objOffset + `${n} 0 obj`.length)).toBe(`${n} 0 obj`);
    }
  });
});

describe("rotaCanvasSize", () => {
  it("grows by one block per week and adds inter-block gaps", () => {
    const five = rotaCanvasSize(5);
    const six = rotaCanvasSize(6);
    // Width is week-count independent; height increases with more weeks.
    expect(six.width).toBe(five.width);
    expect(six.height).toBeGreaterThan(five.height);
  });
});
