import { Col,Row,Button, Checkbox } from 'antd';
import React, { useEffect, useState,useRef } from 'react';
import { SyncOutlined } from "@ant-design/icons";

interface FileViewerProps {
    selectedFile: string;
    file: string;
    onBack: () => void;
    api: string;
    token: string;
  }

const FileViewer: React.FC<FileViewerProps> = ({ file, selectedFile, onBack,api, token }) => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [logs, setLogs] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const fileContentRef = useRef<HTMLDivElement>(null);

  const setLogsData = (data: string) => {
    setLogs( JSON.parse(data).data);
  }
  useEffect(() => {
    const fetchFileContent = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${api}streamfile?token=${token}&file=${file}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.text();
        setFileContent(data);
        setLogsData(data);
        setTimeout(() => {
          setLoading(false);  
        }, 300);
        
      } catch (error) {
        console.error('Error fetching file content:', error);
      }
    };

    fetchFileContent();
  }, [api, token, file,count]);

  useEffect(() => {
    if (fileContentRef.current) {
      fileContentRef.current.scrollTop = fileContentRef.current.scrollHeight;
    }
  }, [fileContent]);

  useEffect(() => {
    let interval: number | null = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        setCount((count) => count + 1);
      }, 5000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh]);

  const handleDownload = async () => {
    try {
      const response = await fetch(`${api}files?token=${token}&files=${file}&rec_id=-1&path=${file}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const blob = await response.blob();
      const element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      element.download = selectedFile;
      document.body.appendChild(element); // Required for this to work in FireFox
      element.click();
      document.body.removeChild(element); // Clean up
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };
  return (
    <div>
      <Row align="middle" >
        <Col style={{padding:"10px"}}>
      <Button  onClick={onBack}>Back</Button>
      &nbsp;
      </Col>
      <Col
       style={{padding:"10px"}}>
      <Button  type="primary" loading={loading} icon={<SyncOutlined />}
            onClick={() => setCount((count) => count + 1)}
            disabled={autoRefresh}
      >Refresh</Button>
      &nbsp;
      </Col>
      <Col>
      <span>Viewing File: {selectedFile}</span>
      </Col>
      <Col style={{ padding: "10px" }}>
          <Checkbox checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)}>
            Auto Refresh
          </Checkbox>
        </Col>
        <Col style={{ padding: "10px" }}>
          <Button onClick={handleDownload}>Download</Button>
        </Col>
      </Row>
      
      {fileContent ? (fileContent.indexOf('level')>0 ? (        
        <div ref={fileContentRef} style={{fontFamily:"monospace",fontSize:"11px", overflow:"auto",textAlign:"left",position:"absolute",left:"10px",right:"10px",top:"80px",bottom:"10px",backgroundColor:"black",color:"white"}}
         dangerouslySetInnerHTML={{ __html: logs || '' }} />
        
      ):<p><div ref={fileContentRef} style={{fontFamily:"monospace",fontSize:"11px", overflow:"auto",textAlign:"left",position:"absolute",left:"10px",right:"10px",top:"80px",bottom:"10px",backgroundColor:"black",color:"white"}}
         dangerouslySetInnerHTML={{ __html: logs?.replace(/INFO/g,"<span class=\"info\">INFO</span>")
            .replace(/ERROR/g,"<span class=\"error\">ERROR</span>").replace(/\n/g, '<br>') || '' }} /></p>) : (
        <p>Loading file content...</p>
      )}
    </div>
  );
};

export default FileViewer;