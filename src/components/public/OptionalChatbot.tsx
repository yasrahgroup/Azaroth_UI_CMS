import React, { useEffect, useState } from 'react';
import { Chatbot } from './Chatbot';

/** Renders only when the trusted, preinstalled chatbot add-on is active. */
export const OptionalChatbot: React.FC = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/public/addons', { signal: controller.signal, cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => setEnabled(Array.isArray(result?.enabled) && result.enabled.includes('website-chatbot')))
      .catch(() => setEnabled(false));
    return () => controller.abort();
  }, []);

  return enabled ? <Chatbot /> : null;
};
