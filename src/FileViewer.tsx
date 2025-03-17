import React, { useEffect, useState } from 'react';

interface FileViewerProps {
    file: string;
    onBack: () => void;
    api: string;
    token: string;
  }

const FileViewer: React.FC<FileViewerProps> = ({ file, onBack,api, token }) => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [logs, setLogs] = useState<string | null>(null);

  
  const setLogsData = (data: string) => {
    setLogs( JSON.parse(data).data);
  }
  useEffect(() => {
    const fetchFileContent = async () => {
      try {
        const response = await fetch(`${api}streamfile?token=${token}&file=${file}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.text();
        setFileContent(data);
        setLogsData(data)
      } catch (error) {
        console.error('Error fetching file content:', error);
      }
    };

    fetchFileContent();
  }, [api, token, file]);

  return (
    <div>
      <button  onClick={onBack}>Back</button>
      &nbsp;
      <span>Viewing File: {file}</span>
      {fileContent ? (
        <div style={{fontFamily:"monospace",fontSize:"11px", overflow:"auto",textAlign:"left",position:"absolute",left:"10px",right:"10px",top:"80px",bottom:"10px",backgroundColor:"black",color:"white"}}
         dangerouslySetInnerHTML={{ __html: logs?.replace(/INFO/g,"<span class=\"info\">INFO</span>")
            .replace(/ERROR/g,"<span class=\"error\">ERROR</span>").replace(/\n/g, '<br>') || '' }} />
        
      ) : (
        <p>Loading file content...</p>
      )}
    </div>
  );
};

export default FileViewer;