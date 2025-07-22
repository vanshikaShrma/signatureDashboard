import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import { Button, Drawer, Form, Upload, message, Card, Popconfirm } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import MainAreaLayout from "../components/main-layout/main-layout";
import { signatureClient, useAppStore } from "../store";
import CustomTable from "../components/CustomTable";
import type { ColumnsType } from "antd/es/table";

const Signatures: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [form] = Form.useForm();
  const [uploadedSign, setUploadedSign] = useState<File | null>(null);
  const userRole = useAppStore().session?.role;
  const id = useAppStore().session?.userId;
  const [signatures, setSignatures] = useState([]);

  useEffect(() => {
    if (id) {
      console.log(
        "YE hai useffect sign vale ka console jo apke userId dikha rha hai: ",
        id
      );
      fetchSignatures(id);
    }
  }, [id]);

  const fetchSignatures = async (userId: string) => {
    try {
      const data = await signatureClient.getAllSignatures(userId);
      setSignatures(data);
    } catch (err) {
      console.error("Failed to load signatures", err);
    }
  };

  const handleUpload = (file: File) => {
    console.log("Uploaded file:", file);
    setUploadedSign(file);
    return false; // Prevent auto-upload
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();

      if (!uploadedSign) {
        message.error("Please upload an Excel file.");
        return;
      }
      if (!id) {
        message.error("User ID is missing.");
        return;
      }

      const formData = new FormData();
      formData.append("sign", uploadedSign);

      const result = await signatureClient.uploadSignature(id, formData);
      await fetchSignatures(id);

      message.success("Excel uploaded successfully!");
      console.log("Upload response:", result);
      const dataArray = result.data;

      if (!Array.isArray(dataArray) || dataArray.length === 0) {
        message.warning("No data found in Excel.");
        return;
      }

      form.resetFields();
      setIsDrawerOpen(false);
    } catch (err) {
      console.error("Upload error:", err);
      message.error("Failed to upload Signature file.");
    }
  };
  const handleDelete = async (signatureId: string) => {
    try {
      await signatureClient.deleteSignature(signatureId);
      message.success("Signature deleted successfully");
      fetchSignatures(id!);
    } catch (error) {
      console.error("Delete error:", error);
      message.error("Failed to delete signature");
    }
  };

  return (
    <MainAreaLayout
      title="Signature Management"
      extra={
        <div style={{ display: "flex", gap: "10px" }}>
          <Button type="primary" onClick={() => setIsDrawerOpen(true)}>
            Add Signature
          </Button>
        </div>
      }
    >
      {/* page body will add here afterwards */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        {signatures.map((signature: any) => (
          <Card
            key={signature._id}
            hoverable
            style={{ width: 240}}
            cover={
              <img
                alt="Signature"
                src={`http://localhost:3000${signature.url}`}
                style={{
                  height: "140px",
                  objectFit: "contain",
                  padding: "10px",
                }}
              />
            }
            actions={[
              <Popconfirm
                title="Are you sure you want to delete this signature?"
                onConfirm={() => handleDelete(signature._id)}
                okText="Yes"
                cancelText="No"
              >
                <DeleteOutlined key="delete" />
              </Popconfirm>,
            ]}
          >
            
          </Card>
        ))}
      </div>

      <Drawer
        title="Upload Signature"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        width={400}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Upload  Signature"
            name="signature"
            rules={[
              { required: true, message: "Please upload an signature file" },
            ]}
          >
            <Upload beforeUpload={handleUpload} maxCount={1}>
              <Button icon={<UploadOutlined />}>Upload Signature</Button>
            </Upload>
          </Form.Item>

          <Button type="primary" block onClick={handleSubmit}>
            Submit
          </Button>
        </Form>
      </Drawer>
    </MainAreaLayout>
  );
};
export default Signatures;
