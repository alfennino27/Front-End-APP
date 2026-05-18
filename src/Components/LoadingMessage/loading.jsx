import React, { useRef, useEffect, useState } from 'react';
import { Button, message } from 'antd';

const App = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const key = 'updatable';

  const openMessage = () => {
    messageApi.open({
      key,
      type: 'loading',
      content: 'Loading...',
    });
    setTimeout(() => {
      messageApi.open({
        key,
        type: 'success',
        content: 'Loaded!',
        duration: 2,
      });
    }, 1000);
  };

  useEffect(() => {
    openMessage();
  }, []);

  return (
    <>
      {contextHolder}
    </>
  );
};

export default App;
