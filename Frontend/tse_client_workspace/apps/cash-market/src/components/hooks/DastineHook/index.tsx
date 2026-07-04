import { useEffect } from 'react';

const useLoadDastineScript = (shouldLoad: boolean) => {
  useEffect(() => {
    if (!shouldLoad) return;
    const loadScript = (src: string): Promise<HTMLScriptElement> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve(script);
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(script);
      });
    };

    let configScript: HTMLScriptElement;
    let dastineScript: HTMLScriptElement;

    loadScript('/assets/libs/dastine/Dastine-Config.js')
      .then((script1) => {
        configScript = script1;
        return loadScript('/assets/libs/dastine/Dastine.js');
      })
      .then((script2) => {
        dastineScript = script2;
        console.log('Dastine and config scripts loaded.');
      })
      .catch((err) => {
        console.error(err);
      });

    return () => {
      if (configScript) document.body.removeChild(configScript);
      if (dastineScript) document.body.removeChild(dastineScript);
    };
  }, [shouldLoad]);
};

export default useLoadDastineScript;
