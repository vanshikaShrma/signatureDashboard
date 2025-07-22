import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import {
  Button,
  Drawer,
  Form,
  Upload,
  message,
  Dropdown,
  Menu,
  MenuProps,
  Modal,
  Input,
} from "antd";
import { UploadOutlined, DownOutlined } from "@ant-design/icons";
import MainAreaLayout from "../components/main-layout/main-layout";
import { requestClient, useAppStore } from "../store";
import CustomTable from "../components/CustomTable";
import type { ColumnsType } from "antd/es/table";

const RequestPage: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [form] = Form.useForm();
  const [uploadedExcel, setUploadedExcel] = useState<File | null>(null);
  const [templateData, setTemplateData] = useState<any>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const [excelRows, setExcelRows] = useState<any[]>([]);
  //row reject krne ke liye
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectingRow, setRejectingRow] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isReasonModalVisible, setIsReasonModalVisible] = useState(false);
  const [rejectionReasonsList, setRejectionReasonsList] = useState<string[]>(
    []
  );

  const userRole = useAppStore().session?.role;
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      requestClient.getTemplateById(id).then((template) => {
        setTemplateData(template);

        // If template.data exists, process it to extract columns and rows
        if (template.data && template.data.length > 0) {
          const headers = Object.keys(template.data[0].data || {});

          // Set columns
          const newColumns: ColumnsType<any> = headers.map(
            (header: string) => ({
              title: header,
              dataIndex: header,
              key: header,
            })
          );

          // Set rows
          const newData = template.data.map((entry: any, index: number) => {
            const obj = {
              key: index,
              _id: entry._id,
              ...entry.data,
              signStatus: entry.signStatus,
              signedDate: entry.signedDate,
              rejectionReason: entry.rejectionReason,
            };
            return obj;
          });
          newColumns.push(
            {
              title: "Sign Status",
              dataIndex: "signStatus",
              key: "signStatus",
            },
            {
              title: "Signed Date",
              dataIndex: "signedDate",
              key: "signedDate",
            },
            getActionsColumn()
          );

          setColumns(newColumns);
          setExcelRows(newData);
        }
      });
    }
  }, [id]);

  const handleUpload = (file: File) => {
    console.log("Uploaded file:", file);
    setUploadedExcel(file);
    return false; // Prevent auto-upload
  };
  const handleReject = (record: any) => {
    console.log("rejecting row is ", record);
    setRejectingRow(record);
    setIsRejectModalVisible(true);
  };
  const handleShowRejectionReasons = (reason: string) => {
    setRejectionReasonsList([reason || "No reason provided"]);
    setIsReasonModalVisible(true);
  };

  const handleDownloadTemplate = async () => {
    if (!id) {
      message.error("Template ID is missing.");
      return;
    }

    try {
      const blob = await requestClient.downloadExcelTemplate(id);

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "template.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      message.success("Template downloaded successfully.");
    } catch (error) {
      console.error("Download failed:", error);
      message.error("Failed to download Excel template.");
    }
  };

  const handlePreview = (record: any) => {
    if (!id || !record._id) {
      message.error("Missing template or row ID.");
      return;
    }
    if (record.signStatus === 5) {
      const signedPdfUrl = `http://localhost:3000/uploads/signed/${id}/${record._id}.pdf`;
      window.open(signedPdfUrl, "_blank", "noopener,noreferrer");
      return;
    }

    requestClient
      .previewDocument(id, record._id)
      .then((response) => {
        const pdfUrl = response.pdfUrl;
        if (pdfUrl) {
          console.log("Opening: ", pdfUrl);
          window.open(pdfUrl, "_blank", "noopener,noreferrer");
        } else {
          message.error("Preview failed: No PDF URL received.");
        }
      })
      .catch((error) => {
        console.error("Preview error:", error);
        message.error("Failed to preview document.");
      });
  };
  const handleDeleteRow = async (record: any) => {
    console.log(record);
    if (!id || !record || !record._id) {
      message.error("Missing template ID or row ID.");
      return;
    }

    try {
      await requestClient.deleteRowFromTemplate(id, record._id);
      message.success("Row deleted successfully!");

      // Filter out the deleted row from state
      setExcelRows((prevRows) =>
        prevRows.filter((row) => row._id !== record._id)
      );
    } catch (error) {
      console.error("Failed to delete row:", error);
      message.error("Failed to delete row.");
    }
  };

  //download krne ke liye
  const handleDownloadSignedPDF = async (record: any) => {
    if (!id || !record._id) {
      message.error("Missing template or row ID.");
      return;
    }

    try {
      const response = await requestClient.downloadSignedPDF(id, record._id);

      const blob = new Blob([response], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${record._id}_signed.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download error:", error);
      message.error("Failed to download signed PDF.");
    }
  };

  const getActionsColumn = (): any => ({
    title: "Actions",
    key: "actions",
    render: (_: any, record: any) => {
      const dropdownItems: MenuProps["items"] = [];

      if (record.signStatus === 2) {
        // Rejected: Only View Reason
        dropdownItems.push({
          key: "view-reason",
          label: (
            <span
              style={{ color: "red" }}
              onClick={() => handleShowRejectionReasons(record.rejectionReason)}
            >
              View Rejection Reason
            </span>
          ),
        });
      } else {
        // Signed → Download + Preview
        if (record.signStatus === 5) {
          dropdownItems.push({
            key: "download",
            label: (
              <span
                style={{ color: "green" }}
                onClick={() => handleDownloadSignedPDF(record)}
              >
                Download
              </span>
            ),
          });
        }

        // Preview (for all non-rejected)
        dropdownItems.push({
          key: "preview",
          label: (
            <span
              style={{ color: "#1890ff" }}
              onClick={() => handlePreview(record)}
            >
              Preview
            </span>
          ),
        });

        // Officer: Reject
        if (userRole === 2 && record.signStatus !== 5) {
          dropdownItems.push({
            key: "reject",
            label: (
              <span
                style={{ color: "red" }}
                onClick={() => handleReject(record)}
              >
                Reject
              </span>
            ),
          });
        }

        // Reader: Delete
        if (userRole !== 2 && record.signStatus !== 5) {
          dropdownItems.push({
            key: "delete",
            label: (
              <span
                style={{ color: "red" }}
                onClick={() => handleDeleteRow(record)}
              >
                Delete
              </span>
            ),
          });
        }
      }

      return (
        <Dropdown menu={{ items: dropdownItems }} trigger={["click"]}>
          <Button>
            Actions <DownOutlined />
          </Button>
        </Dropdown>
      );
    },
  });

  const handleSubmit = async () => {
    try {
      await form.validateFields();

      if (!uploadedExcel) {
        message.error("Please upload an Excel file.");
        return;
      }
      if (!id) {
        message.error("Template ID is missing.");
        return;
      }

      const formData = new FormData();
      formData.append("excel", uploadedExcel);

      const result = await requestClient.uploadExcel(id, formData);

      message.success("Excel uploaded successfully!");
      console.log("Upload response:", result);
      const dataArray = result.data;
      const skippedRows = result.skippedRows || [];

      if (skippedRows.length > 0) {
        message.warning(
          `The following rows were not uploaded because they contain empty fields: ${skippedRows.join(", ")}`
        );
      }

      if (!Array.isArray(dataArray) || dataArray.length === 0) {
        message.warning("No data found in Excel.");
        return;
      }

      // Get headers from first entry's `data` field
      const headers = Object.keys(dataArray[0].data || {});
      const newColumns: ColumnsType<any> = headers.map((header: string) => ({
        title: header,
        dataIndex: header,
        key: header,
      }));

      newColumns.push(
        {
          title: "Sign Status",
          dataIndex: "signStatus",
          key: "signStatus",
          render: (status: number) => {
            switch (status) {
              case 0:
                return "Unsigned";
              case 1:
                return userRole === 2 ? "Ready for Sign" : "Waiting for Sign";
              case 2:
                return "Rejected";
              case 5:
                return "Signed";
              default:
                return "Pending";
            }
          },
        },
        { title: "Signed Date", dataIndex: "signedDate", key: "signedDate" },
        getActionsColumn()
      );

      // Map each item to a table row
      const newData = dataArray.map((entry: any, index: number) => {
        return {
          key: index,
          _id: entry._id,
          ...entry.data,
          signStatus: entry.signStatus,
          signedDate: entry.signedDate || null,
          rejectionReason: entry.rejectionReason || null,
        };
      });

      setColumns(newColumns);
      setExcelRows(newData);

      form.resetFields();
      setUploadedExcel(null);
      setIsDrawerOpen(false);
    } catch (err) {
      console.error("Upload error:", err);
      message.error("Failed to upload Excel file.");
    }
  };

  return (
    <MainAreaLayout
      title="Document Management"
      extra={
        <div style={{ display: "flex", gap: "10px" }}>
          <Button type="primary" onClick={() => setIsDrawerOpen(true)}>
            Bulk Upload
          </Button>

          <Button onClick={handleDownloadTemplate}>
            Download Excel Template
          </Button>
        </div>
      }
    >
      {excelRows.length > 0 && (
        <CustomTable
          serialNumberConfig={{ name: "S.No", show: true }}
          columns={columns}
          data={excelRows}
          onPageChange={() => {}}
        />
      )}

      <Drawer
        title="Upload Excel File"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        width={400}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Upload Excel File"
            name="excel"
            rules={[{ required: true, message: "Please upload an Excel file" }]}
          >
            <Upload beforeUpload={handleUpload} maxCount={1}>
              <Button icon={<UploadOutlined />}>Upload Excel</Button>
            </Upload>
          </Form.Item>

          <Button type="primary" block onClick={handleSubmit}>
            Submit
          </Button>
        </Form>
      </Drawer>

      <Modal
        title="Reject Document"
        open={isRejectModalVisible}
        onCancel={() => {
          setIsRejectModalVisible(false);
          setRejectionReason("");
        }}
        onOk={async () => {
          if (!rejectingRow || !id) return;

          try {
            await requestClient.rejectRowFromTemplate(
              id,
              rejectingRow._id,
              rejectionReason || "Rejected by officer"
            );

            message.success("Document rejected successfully");
            setExcelRows((prev) =>
              prev.map((row) =>
                row._id === rejectingRow._id
                  ? {
                      ...row,
                      signStatus: 2,
                      rejectionReason: rejectionReason || "Rejected",
                    }
                  : row
              )
            );

            setIsRejectModalVisible(false);
            setRejectionReason("");
          } catch (err) {
            console.error("Failed to reject row:", err);
            message.error("Rejection failed");
          }
        }}
        okText="Reject"
      >
        <Form layout="vertical">
          <Form.Item label="Reason">
            <Input.TextArea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason"
            />
          </Form.Item>
        </Form>
      </Modal>
      {/* ye reject vala model hai officer ke liye */}
      <Modal
        title="Rejection Reasons"
        open={isReasonModalVisible}
        onCancel={() => setIsReasonModalVisible(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setIsReasonModalVisible(false)}
          >
            Close
          </Button>,
        ]}
      >
        <ul>
          {rejectionReasonsList.map((reason, index) => (
            <li key={index}>{reason}</li>
          ))}
        </ul>
      </Modal>
    </MainAreaLayout>
  );
};
export default RequestPage;
