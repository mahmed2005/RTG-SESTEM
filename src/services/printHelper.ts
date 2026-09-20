// Universal Print & PDF Service for Desktop & Mobile
export interface PrintableDocument {
  id: string;
  title: string;
  html: string;
}

type DocumentListener = (doc: PrintableDocument | null) => void;

class PrintService {
  private activeDocument: PrintableDocument | null = null;
  private listeners: Set<DocumentListener> = new Set();

  public subscribe(listener: DocumentListener): () => void {
    this.listeners.add(listener);
    listener(this.activeDocument);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public showDocument(doc: { title: string; html: string }) {
    const fullDoc: PrintableDocument = {
      id: "doc-" + Date.now(),
      title: doc.title,
      html: doc.html,
    };
    this.activeDocument = fullDoc;
    this.updatePrintableDom(fullDoc.html);
    this.notify();
  }

  public closeDocument() {
    this.activeDocument = null;
    this.clearPrintableDom();
    this.notify();
  }

  public getActiveDocument(): PrintableDocument | null {
    return this.activeDocument;
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.activeDocument));
  }

  /**
   * Mounts document into body #rtg-printable-area so window.print() can print it with zero popups
   */
  public updatePrintableDom(html: string) {
    let container = document.getElementById("rtg-printable-area");
    if (!container) {
      container = document.createElement("div");
      container.id = "rtg-printable-area";
      document.body.appendChild(container);
    }
    container.innerHTML = html;
  }

  public clearPrintableDom() {
    const container = document.getElementById("rtg-printable-area");
    if (container) {
      container.innerHTML = "";
    }
  }

  /**
   * Triggers native print targeting the current printable document
   */
  public triggerNativePrint() {
    if (!this.activeDocument) return;
    this.updatePrintableDom(this.activeDocument.html);

    // Give browser brief tick to layout print DOM
    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.warn("window.print failed:", err);
      }
    }, 150);
  }

  /**
   * Creates a Blob URL and opens it in a new window/tab safely
   */
  public openInNewTab(): boolean {
    if (!this.activeDocument) return false;
    try {
      const blob = new Blob([this.activeDocument.html], { type: "text/html;charset=utf-8" });
      const blobUrl = URL.createObjectURL(blob);
      const newWin = window.open(blobUrl, "_blank");
      if (!newWin) {
        // Fallback for popups
        const link = document.createElement("a");
        link.href = blobUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Downloads HTML file directly
   */
  public downloadHtmlFile(fileName?: string) {
    if (!this.activeDocument) return;
    const blob = new Blob([this.activeDocument.html], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName || `${this.activeDocument.title.replace(/\s+/g, "_")}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  }
}

export const printService = new PrintService();
