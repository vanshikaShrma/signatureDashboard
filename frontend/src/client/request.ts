// src/client/requestClient.ts
import { Client } from './abstract';

export class RequestClient extends Client {
  constructor(url: string) {
    super(url);
  }

  // Updated method to handle multipart/form-data
  async createSignatureRequest(formData: FormData) {
    try {
      console.log("Now Post request going....");
      console.log(formData);
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      const response = await this.request('POST', '/api/templates', {
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw new Error("Error creating signature request");
    }
  }
  async uploadExcel(templateId: string, formData: FormData) {
    try {
      console.log("Uploading Excel file...");
      const response = await this.request('POST', `/api/templates/${templateId}/upload-excel`, {
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
  async getAllSignatureRequests() {
    try {
      const response = await this.request('GET', '/api/templates');
      console.log(response);
      return response.data;
    } catch (error) {
      console.log(error);
      throw new Error("Error fetching signature requests");
    }
  }
  async getRequestsByOfficer(officerId: string) {
    try {
      const response = await this.request('GET', `/api/templates/officer/${officerId}`);
      console.log(response);
      return response.data;
    } catch (error) {
      console.log(error);
      throw new Error("Error fetching signature requests");
    }
  }
  async getTemplateById(id: string) {
    try {
      const response = await this.request('GET', `/api/templates/${id}`);
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error("Error fetching template by ID");
    }
  }
  async deleteRowFromTemplate(templateId: string, rowId: string) {
    try {
      const response = await this.request('DELETE', `/api/templates/${templateId}/row/${rowId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting row from template:', error);
      throw error;
    }
  }
  async previewDocument(templateId: string, rowId: string) {
    try {
      const response = await this.request('GET', `/api/templates/${templateId}/preview/${rowId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting row from template:', error);
      throw error;
    }
  }
  async downloadExcelTemplate(templateId: string) {
    try {
      const response = await this.request('GET', `/api/templates/${templateId}/excel-template`, {
        responseType: 'blob', // Important: tells Axios to treat response as a Blob
      });
      return response.data; // This is the Blob now
    } catch (error) {
      console.error('Error downloading Excel template:', error);
      throw error;
    }
  }
  async getWordTemplateUrl(templateId: string): Promise<string> {
    try {
      const response = await this.request('GET', `/api/templates/preview/${templateId}`, {
        responseType: 'blob', // Important: response is PDF stream
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob); // Create a blob URL for preview
      return url;
    } catch (error) {
      console.error('Error fetching PDF preview:', error);
      throw error;
    }
  }
  async assignOfficerToTemplate(templateId: string, officerId: string) {
    try {
      const response = await this.request("PATCH", `/api/templates/${templateId}/assign`, {
        data: { officerId }
      });
      return response.data;
    } catch (error) {
      throw new Error("Failed to assign officer");
    }
  }
  async rejectTemplate(templateId: string, reason: string) {
    const response = await this.request('PATCH', `/api/templates/${templateId}/reject`, {
      data: { reason },
    });
    return response.data;
  }
  async cloneTemplate(templateId: string) {
    try {
      const response = await this.request("POST", `/api/templates/${templateId}/clone`);
      return response.data;
    } catch (err) {
      console.error("Clone error", err);
      throw err;
    }
  }
  async deleteTemplate(templateId: string) {
    return this.request("PATCH", `/api/templates/${templateId}/delete`);
  }
  async rejectRowFromTemplate(templateId: string, rowId: string, reason: string) {
    const response = await this.request('PATCH', `/api/templates/${templateId}/row/${rowId}/reject`, {
      data: { reason },
    });
    return response.data;
  }
  async getSignaturesByUser(userId: string) {
    return this.request("GET", `/api/signatures/${userId}`);
  }

  async startSign(templateId: string, signatureId: string) {
    return this.request("PATCH", `/api/signatures/start-sign/${templateId}`, {
      data: { signatureId },
    });
  }
  async downloadSignedPDF(templateId: string, rowId: string) {
    const response = await this.request('GET', `/api/templates/${templateId}/row/${rowId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }
  async downloadAllSignedDocs(userId: string) {
    const response = await this.request("GET", `/api/templates/${userId}/download-all`, {
      responseType: "blob",
    });
    return response.data;
  }
  async delegateRequest(templateId: string, delegateId: string) {
    return this.request("PATCH", `/api/templates/${templateId}/delegate`, {
      data:{delegateId},
    });
  }








}
