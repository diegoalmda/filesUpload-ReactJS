import React, { useState, useEffect } from 'react';
import { uniqueId } from 'lodash';
import filesize from 'filesize';

import api from './services/api';

import GlobalStyle from './styles/global';
import { Container, Content } from './styles';

import Upload from './components/Upload';
import FileList from './components/FileList';

function App() {
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const componentDidMount = async () => {
    const response = await api.get('posts');
  
    setUploadedFiles(response.data.map(file => ({
      id: file._id,
      name: file.name,
      readableSize: filesize(file.size),
      preview: file.url,
      uploaded: true,
      url: file.url
    })));
  }

  useEffect(()=> {
    componentDidMount();
  },[]);

  const handleUpload = (files) => {
    const uploadedOnes = files.map(file => ({
      file,
      id: uniqueId(),
      name: file.name,
      readableSize: filesize(file.size),
      preview: URL.createObjectURL(file),
      progress: 0,
      uploaded: false,
      error: false,
      url: null,
    }))
    const data = [...uploadedFiles];
    setUploadedFiles(data.concat(uploadedOnes));

    uploadedFiles.forEach(processUpload);
  }

  const updateFile = (id, data) => {
    const files = uploadedFiles.map(uploadedFile => {
      return id === uploadedFile.id ? { ...uploadedFile, ...data } : uploadedFile;
    });
    setUploadedFiles(files);
  }

  const processUpload = (uploadedFile) => {
    const data = new FormData();

    data.append('file', uploadedFile.file, uploadedFile.name);

    api.post('posts', data, {
      onUploadProgress: e => {
        const progress = parseInt(Math.round((e.loaded * 100) / e.total));

        updateFile(uploadedFile.id, {progress});
      }
    }).then((response) => {
      updateFile(uploadedFile.id, {
        uploaded: true,
        id: response.data._id,
        url: response.data.url
      });
    }).catch(() => {
      updateFile(uploadedFile.id, {
        error: true
      });
    });
  };

  const handleDelete = async (id) => {
    await api.delete(`posts/${id}`);

    setUploadedFiles(uploadedFiles.filter(file => file.id !== id));
    componentWillUnmount();
  }

  const componentWillUnmount = () => {
    uploadedFiles.forEach(file => URL.revokeObjectURL(file.preview));
  }

  return (
    <Container>
      <Content>
        <Upload onUpload={handleUpload} />
          { !!uploadedFiles.length && (
            <FileList files={uploadedFiles} onDelete={handleDelete} />
          )}        
      </Content>
      <GlobalStyle />
    </Container>    
  );
}

export default App;