// src/client/requestClient.ts
import { Client } from './abstract';

export class SignatureClient extends Client {
    constructor(url: string) {
        super(url);
    }

    // Updated method to handle multipart/form-data
   
    async uploadSignature(userId: string, formData: FormData) {
        try {
            console.log("Uploading Signature file...");
            const response = await this.request('POST', `/api/signatures/${userId}`, {
                data: formData,
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data;
        } catch (error) {
            console.error(error);
            throw new Error("Error uploading Excel file");
        }
    }
    async getAllSignatures(userId: string) {
        try {
            const response = await this.request('GET', `/api/signatures/${userId}`);
            console.log(response);
            return response.data;
        } catch (error) {
            console.log(error);
            throw new Error("Error fetching signature requests");
        }
    }
    async deleteSignature(signatureId: string) {
        try {
            const response = await this.request('DELETE', `/api/signatures/${signatureId}`);
            return response.data;
        } catch (error) {
            console.error("Delete signature failed", error);
            throw new Error("Failed to delete signature");
        }
}
  
    }
