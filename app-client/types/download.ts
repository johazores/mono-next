export type DownloadFile = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export type PurchaseDownload = {
  purchaseId: string;
  productName: string;
  productType: string;
  purchaseDate: string;
  files: DownloadFile[];
};
