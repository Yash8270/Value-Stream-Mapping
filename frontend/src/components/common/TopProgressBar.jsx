import React, { useEffect, useState } from 'react';
import { useVSM } from '../../context/Context';

export default function TopProgressBar() {
  const { loading, saveStatus, importStatus } = useVSM();
  const isBusy = loading || saveStatus === 'saving' || importStatus === 'uploading';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timeout;
    if (isBusy) {
      setVisible(true);
    } else {
      timeout = setTimeout(() => {
        setVisible(false);
      }, 350);
    }
    return () => clearTimeout(timeout);
  }, [isBusy]);

  if (!visible) return null;

  return (
    <div className="top-loading-bar-container">
      <div className="top-loading-bar-indeterminate" />
      <div className="top-loading-bar-indeterminate-secondary" />
    </div>
  );
}
