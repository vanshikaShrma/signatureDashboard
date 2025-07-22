import React, { useState, useEffect } from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  Select,
  message,
  Space,
  Upload,
  Dropdown,
  Menu,
  MenuProps,
  Modal,
  Tag,
} from "antd";
import { UploadOutlined, DownOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import CustomTable from "../components/CustomTable";
import MainAreaLayout from "../components/main-layout/main-layout";
import { courtClient, useAppStore } from "../store";
import { requestClient } from "../store"; // Import the createRequest function

const { Option } = Select;
const { Search } = Input;

const initialData: any[] = [];

const Requests: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [form] = Form.useForm();
  const [data, setData] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [officers, setOfficers] = useState<any[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  //officer aasign krne ko
  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [assignForm] = Form.useForm();

  //ye sara reject ke liye hai
  const [isReasonModalVisible, setIsReasonModalVisible] = useState(false);
  const [rejectionReasonsList, setRejectionReasonsList] = useState<string[]>(
    []
  );
  const [templateToReject, setTemplateToReject] = useState<string | null>(null);

  //reject krne ke liye
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  //sign krne ke liye
  const [isSignModalVisible, setIsSignModalVisible] = useState(false);
  const [availableSignatures, setAvailableSignatures] = useState<any[]>([]);
  const [selectedTemplateToSign, setSelectedTemplateToSign] = useState<
    string | null
  >(null);
  const [selectedSignatureId, setSelectedSignatureId] = useState<string | null>(
    null
  );

  //delegate ke liye
  const [isDelegateModalVisible, setIsDelegateModalVisible] = useState(false);
  const [delegateCandidates, setDelegateCandidates] = useState<any[]>([]);
  const [selectedDelegateId, setSelectedDelegateId] = useState<string | null>(
    null
  );
  const [templateToDelegate, setTemplateToDelegate] = useState<string | null>(
    null
  );

  const userRole = useAppStore().session?.role;
  const session = useAppStore().session?.userId;
  const navigate = useNavigate();
  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: any) => (
        <Button type="link" onClick={() => handleViewTemplate(record.key)}>
          {text}
        </Button>
      ),
    },
    {
      title: "Number of Docs",
      dataIndex: "Number of Docs",
      key: "Number of Docs",
      render: (_: any, record: any) => (
        <span
          style={{ cursor: "pointer", color: "#1890ff" }}
          onClick={() => navigate(`/dashboard/request/${record.key}`)}
        >
          {record["Number of Docs"]}
        </span>
      ),
    },
    {
      title: "Rejected Docs",
      dataIndex: "rejectedDocs",
      key: "rejectedDocs",
      render: (rejectedDocs: any, record: any) => (
        <span
          style={{ cursor: "pointer", color: "#eb2f96" }}
          onClick={() => navigate(`/dashboard/rejected/${record.key}`)}
        >
          {rejectedDocs}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: number) => {
        const statusMap: { [key: number]: { text: string; color: string } } = {
          0: { text: "Draft", color: "default" },
          1: {
            text: userRole === 2 ? "Ready for Sign" : "Waiting for Sign",
            color: "blue",
          },
          2: { text: "Rejected", color: "red" },
          3: { text: "Delegated", color: "purple" },
          4: { text: "In Process", color: "orange" },
          5: { text: "Signed", color: "green" },
          6: { text: "Ready for Dispatch", color: "gold" },
          7: { text: "Dispatched", color: "cyan" },
        };

        const { text, color } = statusMap[status] || {
          text: "Unknown",
          color: "default",
        };

        return <Tag color={color}>{text}</Tag>;
      },
    },
    // {
    //   title: "Action",
    //   key: "action",
    //   render: (_: any, record: any) => {
    //     const isOfficer = userRole === 2; // Officer role
    //     const isRejected = record.status === 2;
    //     const menuItems: MenuProps["items"] = [];

    //     // Rejected: only show rejection reason
    //     if (isRejected) {
    //       menuItems.push({
    //         key: "reason",
    //         label: (
    //           <span onClick={() => handleShowRejectionReasons(record.key)}>
    //             View Rejection Reason
    //           </span>
    //         ),
    //       });
    //     } else {
    //       // Other statuses — show based on role
    //       if (isOfficer) {
    //         if (record.status === 1) {
    //           menuItems.push(
    //             {
    //               key: "sign",
    //               label: (
    //                 <span onClick={() => handleSign(record.key)}>Sign</span>
    //               ),
    //             },
    //             {
    //               key: "delegate",
    //               label: (
    //                 <span
    //                   onClick={() => {
    //                     handleOpenDelegateModal(record.key);
    //                   }}
    //                 >
    //                   Delegate
    //                 </span>
    //               ),
    //             },

    //             {
    //               key: "reject",
    //               label: (
    //                 <span
    //                   onClick={() => {
    //                     setTemplateToReject(record.key);
    //                     setIsRejectModalVisible(true);
    //                   }}
    //                 >
    //                   Reject
    //                 </span>
    //               ),
    //             }
    //           );
    //         } else if (record.status === 5) {
    //           menuItems.push(
    //             {
    //               key: "submit",
    //               label: (
    //                 <span onClick={() => handleClick("Submit")}>Submit</span>
    //               ),
    //             },
    //             {
    //               key: "dispatch",
    //               label: (
    //                 <span onClick={() => handleClick("Dispatch")}>
    //                   Dispatch
    //                 </span>
    //               ),
    //             },
    //             {
    //               key: "print",
    //               label: (
    //                 <span onClick={() => handleClick("Print")}>Print</span>
    //               ),
    //             }
    //           );
    //         }
    //       } else {
    //         // Reader-specific actions
    //         if (record.status === 0) {
    //           menuItems.push(
    //             {
    //               key: "request-sign",
    //               label: (
    //                 <span
    //                   onClick={() => {
    //                     setSelectedTemplateId(record.key);
    //                     setAssignDrawerOpen(true);
    //                   }}
    //                 >
    //                   Request to Sign
    //                 </span>
    //               ),
    //             },
    //             {
    //               key: "delete",
    //               label: (
    //                 <span onClick={() => handleDeleteTemplate(record.key)}>
    //                   Delete
    //                 </span>
    //               ),
    //             }
    //           );
    //         } else if (record.status === 5) {
    //           menuItems.push(
    //             {
    //               key: "download",
    //               label: (
    //                 <span onClick={() => handleDownloadAllSignedDocs()}>
    //                   Download All
    //                 </span>
    //               ),
    //             },
    //             {
    //               key: "print",
    //               label: <span onClick={() => console.log("View")}>Print</span>,
    //             }
    //           );
    //         } else if (record.status === 3) {
    //           menuItems.push({
    //             key: "sign-delegated",
    //             label: <span onClick={() => handleSign(record.key)}>Sign</span>,
    //           });
    //         }
    //         // Only Reader can see Clone & Delete
    //         menuItems.push({
    //           key: "clone",
    //           label: (
    //             <span onClick={() => handleCloneTemplate(record.key)}>
    //               Clone
    //             </span>
    //           ),
    //         });
    //       }
    //     }

    //     return (
    //       <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
    //         <Button>
    //           Actions <DownOutlined />
    //         </Button>
    //       </Dropdown>
    //     );
    //   },
    // },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: any) => {
        const isOfficer = userRole === 2;
        const isRejected = record.status === 2;
        const isCreator = record.createdBy === session;
        const isAssignedToUser = record.officer === session;
        const isDelegatedToUser = record.delegatedTo === session;

        const menuItems: MenuProps["items"] = [];

        // Rejected: show reason
        if (isRejected) {
          menuItems.push({
            key: "reason",
            label: (
              <span onClick={() => handleShowRejectionReasons(record.key)}>
                View Rejection Reason
              </span>
            ),
          });
        } else {
          // Officer logic (status 1 & assigned to officer)
          if (isOfficer && record.status === 1 && isAssignedToUser) {
            menuItems.push(
              {
                key: "sign",
                label: <span onClick={() => handleSign(record.key)}>Sign</span>,
              },
              {
                key: "delegate",
                label: (
                  <span onClick={() => handleOpenDelegateModal(record.key)}>
                    Delegate
                  </span>
                ),
              },
              {
                key: "reject",
                label: (
                  <span
                    onClick={() => {
                      setTemplateToReject(record.key);
                      setIsRejectModalVisible(true);
                    }}
                  >
                    Reject
                  </span>
                ),
              }
            );
          }

          //Delegated — for both officer or reader
          if (record.status === 3 && isDelegatedToUser) {
            menuItems.push({
              key: "sign-delegated",
              label: <span onClick={() => handleSign(record.key)}>Sign</span>,
            });
          }

          // Reader can request to sign or delete on Draft (status 0)
          if (!isOfficer && record.status === 0 && isCreator) {
            menuItems.push(
              {
                key: "request-sign",
                label: (
                  <span
                    onClick={() => {
                      setSelectedTemplateId(record.key);
                      setAssignDrawerOpen(true);
                    }}
                  >
                    Request to Sign
                  </span>
                ),
              },
              {
                key: "delete",
                label: (
                  <span onClick={() => handleDeleteTemplate(record.key)}>
                    Delete
                  </span>
                ),
              }
            );
          }

          // Download/Print for signed
          if (record.status === 5) {
            menuItems.push(
              {
                key: "download",
                label: (
                  <span onClick={() => handleDownloadAllSignedDocs()}>
                    Download All
                  </span>
                ),
              },
              {
                key: "print",
                label: <span onClick={() => console.log("Print")}>Print</span>,
              }
            );
          }

          // Clone only for reader (not officer)
          if (!isOfficer) {
            menuItems.push({
              key: "clone",
              label: (
                <span onClick={() => handleCloneTemplate(record.key)}>
                  Clone
                </span>
              ),
            });
          }
        }

        return (
          <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
            <Button>
              Actions <DownOutlined />
            </Button>
          </Dropdown>
        );
      },
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const officersResponse = await courtClient.getOfficers();
        setOfficers(officersResponse);
        await fetchAllRequests();
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleUpload = (file: File) => {
    console.log(file);
    setUploadedFile(file);
    return false;
  };
  const handleViewTemplate = async (templateId: string) => {
    try {
      const url = await requestClient.getWordTemplateUrl(templateId);
      window.open(url, "_blank"); // Open in new tab
    } catch (error) {
      console.error("Failed to open Word template:", error);
    }
  };

  const fetchAllRequests = async () => {
    try {
      let response;

      if (userRole === 2 && session) {
        // Officer: fetch only requests associated with this officer
        console.log("If m to aage");
        console.log(session);
        response = await requestClient.getRequestsByOfficer(session); // You need to define this method in your API client
      } else {
        // Other roles: fetch all created requests
        response = await requestClient.getAllSignatureRequests();
      }
      const formatted = response.map((item: any) => ({
        key: item._id,
        title: item.templateName,
        officer: item.assignedTo,
        delegatedTo: item.delegatedTo,
        createdBy: item.createdBy,
        "Number of Docs": item.docCount || 0,
        rejectedDocs: item.rejectedDocs || 0,
        status: item.signStatus,
      }));
      setData(formatted);
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch requests");
    }
  };

  const handleCreateRequest = async () => {
    try {
      const values = await form.validateFields(["title"]);
      console.log(`Values of form: ${values}`);
      console.log(JSON.stringify(values));

      const formData = new FormData();
      formData.append("title", values.title);
      // formData.append('officerId', values.officer);
      if (uploadedFile) {
        console.log(uploadedFile);
        formData.append("file", uploadedFile);
        for (let [key, value] of formData.entries()) {
          console.log(key, value);
        }
      } else {
        message.error("Please upload a template file.");
        return;
      }

      console.log("hello");
      // Make API request to create request
      const response = await requestClient.createSignatureRequest(formData);

      if (response) {
        message.success("Request Created Successfully");
        form.resetFields();
        setIsDrawerOpen(false);
        await fetchAllRequests();
      }
    } catch (err) {
      console.log("Validation failed", err);
      message.error("Failed to create request.");
    }
  };
  const handleAssignOfficer = async (values: any) => {
    if (!selectedTemplateId) {
      message.error("No request selected");
      return;
    }

    try {
      await requestClient.assignOfficerToTemplate(
        selectedTemplateId,
        values.officerId
      );
      message.success("Request assigned successfully");
      setAssignDrawerOpen(false);
      await fetchAllRequests(); // Refresh list
    } catch (err) {
      console.error(err);
      message.error("Failed to assign officer");
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleClick = (actionType: string) => {
    message.info(`"${actionType}" clicked`);
  };

  const filteredData = data.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  //rejection ke liye function jo puri request reject krta hai
  const handleShowRejectionReasons = async (templateId: string) => {
    try {
      const res = await requestClient.getTemplateById(templateId);

      if (!res) {
        message.error("Template not found");
        return;
      }
      const reason = res?.rejectionReason || "No reson provided";
      setRejectionReasonsList([reason]);
      setIsReasonModalVisible(true);
    } catch (err) {
      console.error("Error fetching template:", err);
      message.error("Could not load rejection reason");
    }
  };
  //clone karne ke liye
  const handleCloneTemplate = async (templateId: string) => {
    try {
      const res = await requestClient.cloneTemplate(templateId);
      message.success("Template cloned successfully!");
      await fetchAllRequests(); // Refresh the table
    } catch (err) {
      console.error("Clone failed:", err);
      message.error("Failed to clone template");
    }
  };
  //pura template request delete krne ke liye
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await requestClient.deleteTemplate(templateId);
      message.success("Request deleted successfully");
      await fetchAllRequests(); // Refresh table
    } catch (err) {
      console.error("Delete failed:", err);
      message.error("Failed to delete template");
    }
  };
  //handle sign
  const handleSign = async (templateId: string) => {
    setSelectedTemplateToSign(templateId);
    try {
      const userId = useAppStore.getState().session?.userId;
      console.log("User Id hai handle sign ke andar ye: ", userId);
      if (!userId) {
        message.error("User ID not found");
        return;
      }
      const res = await requestClient.getSignaturesByUser(userId);
      setAvailableSignatures(res.data || []);
      setIsSignModalVisible(true);
    } catch (error) {
      console.error("Error fetching signatures", error);
      message.error("Failed to load signatures");
    }
  };
  //download all
  const handleDownloadAllSignedDocs = async () => {
    try {
      if (!session) {
        message.error("Template ID not found");
        return;
      }
      console.log(data);
      const response = await requestClient.downloadAllSignedDocs(session);

      const blob = new Blob([response], { type: "application/zip" });
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `signed_documents_${session}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Failed to download all signed documents:", error);
      message.error("Failed to download ZIP");
    }
  };
  const handleOpenDelegateModal = async (templateId: string) => {
    try {
      const [officersList, template] = await Promise.all([
        courtClient.getOfficers(),
        requestClient.getTemplateById(templateId),
      ]);

      const creator = {
        id: template.createdBy, // Adjust based on structure
        name: "Creator",
      };

      // Include creator only if not already an officer
      const finalList = [
        ...officersList,
        ...(officersList.find((o) => o.id === creator.id) ? [] : [creator]),
      ];

      setDelegateCandidates(finalList);
      setTemplateToDelegate(templateId);
      setIsDelegateModalVisible(true);
    } catch (err) {
      console.error("Error fetching delegate list", err);
      message.error("Failed to open delegate modal");
    }
  };
  const handleDelegate = async () => {
    if (!templateToDelegate || !selectedDelegateId) {
      message.error("Please select a delegate");
      return;
    }

    try {
      await requestClient.delegateRequest(
        templateToDelegate,
        selectedDelegateId
      );
      message.success("Request delegated successfully");
      setIsDelegateModalVisible(false);
      setSelectedDelegateId(null);
      fetchAllRequests(); // Refresh
    } catch (err) {
      console.error("Delegate failed", err);
      message.error("Failed to delegate request");
    }
  };

  return (
    <MainAreaLayout
      title="Requests"
      extra={
        <div className="flex items-center gap-4">
          <Search
            placeholder="Search requests"
            onSearch={handleSearch}
            style={{ width: 250, height: 40 }}
            allowClear
          />
          <Button
            type="primary"
            onClick={() => setIsDrawerOpen(true)}
            className="h-10 px-6 text-base"
          >
            New Request for Signature
          </Button>
        </div>
      }
    >
      <CustomTable
        serialNumberConfig={{ name: "S.No", show: true }}
        columns={columns}
        data={filteredData}
        onPageChange={() => {}}
      />

      <Drawer
        title="Create Signature Request"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        width={400}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: "Enter title" }]}
          >
            <Input placeholder="Enter Request Title" />
          </Form.Item>

          <Form.Item label="Upload Template File">
            <Upload beforeUpload={handleUpload} maxCount={1}>
              <Button icon={<UploadOutlined />}>Upload Docx</Button>
            </Upload>
          </Form.Item>

          <Button type="primary" block onClick={handleCreateRequest}>
            Create Request
          </Button>
        </Form>
      </Drawer>
      <Drawer
        title="Assign Officer to Request"
        open={assignDrawerOpen}
        onClose={() => setAssignDrawerOpen(false)}
        width={400}
      >
        <Form
          form={assignForm}
          layout="vertical"
          onFinish={handleAssignOfficer}
        >
          <Form.Item
            label="Select Officer"
            name="officerId"
            rules={[{ required: true, message: "Please select an officer" }]}
          >
            <Select placeholder="Choose officer">
              {officers.map((officer) => (
                <Option key={officer.id} value={officer.id}>
                  {officer.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Assign
          </Button>
        </Form>
      </Drawer>
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

      <Modal
        title="Select Signature"
        open={isSignModalVisible}
        onCancel={() => setIsSignModalVisible(false)}
        onOk={async () => {
          if (!selectedSignatureId || !selectedTemplateToSign) {
            message.error("Please select a signature");
            return;
          }

          try {
            await requestClient.startSign(
              selectedTemplateToSign,
              selectedSignatureId
            );
            message.success("Signing started. Will complete in few minute.");
            setIsSignModalVisible(false);
            fetchAllRequests(); // optional refresh
          } catch (error) {
            console.error("Sign error:", error);
            message.error("Signing failed");
          }
        }}
        okText="Sign"
      >
        <div>
          {availableSignatures.map((sig) => (
            <div key={sig._id} style={{ marginBottom: 10 }}>
              <input
                type="radio"
                name="signature"
                value={sig._id}
                onChange={(e) => setSelectedSignatureId(e.target.value)}
              />
              <img
                src={`http://localhost:3000${sig.url}`}
                alt="Signature"
                style={{ height: 50, marginLeft: 10 }}
              />
            </div>
          ))}
        </div>
      </Modal>
      <Modal
        title="Delegate Request"
        open={isDelegateModalVisible}
        onCancel={() => setIsDelegateModalVisible(false)}
        onOk={handleDelegate}
        okText="Delegate"
      >
        <Select
          style={{ width: "100%" }}
          placeholder="Select delegate"
          onChange={(val) => setSelectedDelegateId(val)}
        >
          {delegateCandidates.map((officer) => (
            <Option key={officer.id} value={officer.id}>
              {officer.name}
            </Option>
          ))}
        </Select>
      </Modal>
      <Modal
        title="Reject Request"
        open={isRejectModalVisible}
        onCancel={() => {
          setIsRejectModalVisible(false);
          setRejectionReason("");
        }}
        onOk={async () => {
          if (!templateToReject || !rejectionReason.trim()) {
            message.error("Please provide a reason to reject");
            return;
          }

          try {
            await requestClient.rejectTemplate(
              templateToReject,
              rejectionReason
            );
            message.success("Request rejected successfully");
            setIsRejectModalVisible(false);
            setRejectionReason("");
            fetchAllRequests(); // Refresh table
          } catch (err) {
            console.error("Rejection failed", err);
            message.error("Failed to reject request");
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
    </MainAreaLayout>
  );
};

export default Requests;
