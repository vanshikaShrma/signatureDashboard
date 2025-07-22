import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import { message, Tag } from "antd";
import MainAreaLayout from "../components/main-layout/main-layout";
import { requestClient, useAppStore } from "../store";
import CustomTable from "../components/CustomTable";
import type { ColumnsType } from "antd/es/table";

const RejectedPage: React.FC = () => {
  const [columns, setColumns] = useState<any[]>([]);
  const [excelRows, setExcelRows] = useState<any[]>([]);

  const userRole = useAppStore().session?.role;
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      requestClient.getTemplateById(id).then((template) => {
        if (template.data && template.data.length > 0) {
          const rejectedRows = template.data.filter(
            (entry: any) => entry.signStatus === 2
          );

          if (rejectedRows.length === 0) {
            message.info("No rejected documents found.");
          }

          const headers = Object.keys(rejectedRows[0].data || {});

          const newColumns: ColumnsType<any> = headers.map((header) => ({
            title: header,
            dataIndex: header,
            key: header,
          }));

          newColumns.push(
            {
              title: "Status",
              dataIndex: "signStatus",
              key: "signStatus",
              render: () => <Tag color="red">Rejected</Tag>,
            },
            {
              title: "Rejection Reason",
              dataIndex: "rejectionReason",
              key: "rejectionReason",
            }
          );

          const newData = rejectedRows.map((entry: any, index: number) => ({
            key: index,
            ...entry.data,
            rejectionReason: entry.rejectionReason || "-",
          }));

          setColumns(newColumns);
          setExcelRows(newData);
        }
      });
    }
  }, [id]);

  return (
    <MainAreaLayout title="Rejected Docs">
      <CustomTable
        serialNumberConfig={{ name: "S.No", show: true }}
        columns={columns}
        data={excelRows}
        onPageChange={() => {}}
      />
    </MainAreaLayout>
  );
};

export default RejectedPage;
