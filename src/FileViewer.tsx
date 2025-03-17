import { Col,Row,Button } from 'antd';
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

  return (
    <div>
      <Row align="middle" >
        <Col style={{padding:"10px"}}>
      <Button  onClick={onBack}>Back</Button>
      &nbsp;
      </Col>
      <Col
      Col style={{padding:"10px"}}>
      <Button  type="primary" loading={loading} icon={<SyncOutlined />}
            onClick={() => setCount((count) => count + 1)}
      >Refresh</Button>
      &nbsp;
      </Col>
      <Col>
      <span>Viewing File: {selectedFile}</span>
      </Col>
      </Row>
      {fileContent ? (
        <div ref={fileContentRef} style={{fontFamily:"monospace",fontSize:"11px", overflow:"auto",textAlign:"left",position:"absolute",left:"10px",right:"10px",top:"80px",bottom:"10px",backgroundColor:"black",color:"white"}}
         dangerouslySetInnerHTML={{ __html: logs?.replace(/INFO/g,"<span class=\"info\">INFO</span>")
            .replace(/ERROR/g,"<span class=\"error\">ERROR</span>").replace(/\n/g, '<br>') || '' }} />
        
      ) : (
        <p>Loading file content...</p>
      )}
    </div>
  );
};

export default FileViewer;