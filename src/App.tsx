import { Button, Breadcrumb, Table, Row, Col, Input } from "antd";
import {
  HomeOutlined,
  SyncOutlined,
  FileOutlined,
  FolderOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

import { useState, useEffect } from "react";
//import { FaFile, FaFolder } from "react-icons/fa"; // Import the file icon from react-icons
import FileViewer from "./FileViewer";
import { Flex } from "antd";
import "./App.css";

interface FileDataType {
  type: string;
  name: string;
  creation_time: number;
  modification_time: number;
  size: number;
}

function App() {
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);
  const [token, setToken] = useState("");
  const [api, setApi] = useState("");
  const [apiData, setApiData] = useState([]);
  const [basePath, setBasePath] = useState<string[]>([]); // Create basePath state
  const [selectedFile, setSelectedFile] = useState<string | null>(null); // State to track the selected file
  const [filterText, setFilterText] = useState<string>(""); // State to track the filter text

  const transformBasePath = (
    basePath: string[]
  ): { title: string; onClick: () => void }[] => {
    return basePath.map((path, index) => ({
      title: path.replace(/\//g, ""),
      onClick: () => {
        setBasePath(basePath.slice(0, index + 1));
        setCount(count + 1); // Trigger the useEffect to refresh the data
      },
    }));
  };

  const handleFolderClick = (path: string) => {
    setBasePath([...basePath, path]);
    setCount(count + 1); // Trigger the useEffect to refresh the data
  };

  const handleFileClick = (file: string) => {
    setSelectedFile(file); // Set the selected file
  };

  const handleBack = () => {
    setSelectedFile(null); // Clear the selected file to go back to the table
  };

  const formatSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024)
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const columns: ColumnsType<FileDataType> = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (text: string, record: FileDataType) =>
        text === "file" ? (
          <FileOutlined
            onClick={() => handleFileClick(record.name)}
            style={{ cursor: "pointer", fontSize: "140%" }}
          />
        ) : (
          <FolderOutlined
            onClick={() => handleFolderClick(record.name)}
            style={{ cursor: "pointer", fontSize: "140%" }}
          />
        ), // Render file icon if type is 'file'
      sorter: (a, b) => a.type.localeCompare(b.type),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: FileDataType) => {
        const isRecent =
          Date.now() - record.modification_time * 1000 < 4 * 60 * 60 * 1000;
        const isOld =
          Date.now() - record.modification_time * 1000 > 24 * 60 * 60 * 1000;
        return (
          <>
            {record.type!=="dir" &&
            <span
              style={{ color: isRecent ? "red" : isOld ? "#888" : "inherit" }}
            >
              {text}
            </span>
       } {record.type==="dir" &&
            <span style={{ fontWeight: "bolder" }}>{text}</span>}
          </>
        );
      },
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Creation",
      dataIndex: "creation_time",
      key: "creation_time",
      render: (text: number) => new Date(text * 1000).toLocaleString(),
      sorter: (a, b) => (a.creation_time > b.creation_time ? 1 : -1),
    },
    {
      title: "Modification",
      dataIndex: "modification_time",
      key: "modification_time",

      render: (text: number) => new Date(text * 1000).toLocaleString(),
      sorter: (a, b) => (a.modification_time > b.modification_time ? 1 : -1),
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      render: (size: number, record: FileDataType) =>
        record.type !== "dir" ? formatSize(size) : "",
      sorter: (a, b) => (a.size > b.size ? 1 : -1),
    },
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    }
    const apiParam = params.get("api");
    if (apiParam) {
      setApi(apiParam);
    }
    const basePath = params.get("path");
    if (basePath) {
      setBasePath([basePath]);
    }
  }, []);

  useEffect(() => {
    //refresh();
    if (api && token) {
      setLoading(true);

      //alert(api+'listdir?token='+token);
      fetch(api + "listdir?token=" + token, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rec_id: -1, path: basePath.join("/") }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (filterText === "") setApiData(data.data);
          else {
            const data2 = data.data.filter((item: FileDataType) =>
              item.name.includes(filterText)
            );
            setApiData(data2);
          }
        })
        .then(() => {
          setTimeout(() => {
            setLoading(false);
          }, 300);
        })
        .catch((error) => console.error("Error fetching API:", error));
    }
  }, [api, token, count, basePath, filterText]);

  return (
    <div
      style={{
        width: "100%",
        padding: "5px",
        verticalAlign: "top",
        overflow: "hidden",
      }}
    >
      {!selectedFile && (
        <Flex gap="middle" align="start" vertical style={{ marginBottom: 16 }}>
          <Row align="middle">
            <Col style={{ padding: "10px" }}>
              <Button
                type="primary"
                icon={<SyncOutlined />}
                onClick={() => setCount((count) => count + 1)}
                loading={loading}
              >
                Refresh
              </Button>
            </Col>
            <Col style={{ padding: "10px" }}>
              {basePath.length > 1 && (
                <Breadcrumb>
                  {transformBasePath(basePath).map((item, index) => (
                    <Breadcrumb.Item key={index} onClick={item.onClick}>
                      {index == 0 ? <HomeOutlined /> : item.title}
                    </Breadcrumb.Item>
                  ))}
                </Breadcrumb>
              )}
            </Col>
            <Col>
              <Input
                placeholder="Filter by name"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </Col>
          </Row>
        </Flex>
      )}
      {selectedFile ? (
        <FileViewer
          file={basePath.join("/") + "/" + selectedFile}
          selectedFile={selectedFile}
          onBack={handleBack}
          api={api}
          token={token}
        />
      ) : (
        <>
          <Table
            dataSource={apiData}
            columns={columns}
            size="small"
            style={{ width: "100%" }}
            pagination={{ pageSize: 16 }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "0",
              right: "0",
              padding: "10px",
            }}
          >
            <span
              title={
                "href->" +
                window.location.href +
                "\r\napi->" +
                api +
                "\r\nbasePath->" +
                basePath +
                "\r\ntoken->" +
                token
              }
            >
              v0.9
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
