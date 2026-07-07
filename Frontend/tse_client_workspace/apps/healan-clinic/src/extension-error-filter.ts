/** جلوگیری از نمایش خطاهای افزونه MetaMask در overlay و console */
if (typeof window !== 'undefined') {
  const serializeError = (value: unknown): string => {
    if (value instanceof Error) {
      return `${value.message}\n${value.stack ?? ''}`;
    }
    return String(value ?? '');
  };

  const isExtensionNoise = (value: unknown): boolean => {
    const text = serializeError(value);
    return (
      /metamask/i.test(text) ||
      text.includes('nkbihfbeogaeaoehlefnkodbefgpgknn') ||
      text.includes('Failed to connect to MetaMask') ||
      text.includes('inpage.js') ||
      /chrome-extension:\/\//.test(text)
    );
  };

  const swallowExtensionEvent = (event: Event) => {
    const errorEvent = event as ErrorEvent;
    const rejectionEvent = event as PromiseRejectionEvent;
    const noisy =
      isExtensionNoise(errorEvent.message) ||
      isExtensionNoise(errorEvent.error) ||
      isExtensionNoise(errorEvent.filename) ||
      isExtensionNoise(rejectionEvent.reason);

    if (noisy) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  window.addEventListener('error', swallowExtensionEvent, true);
  window.addEventListener('unhandledrejection', swallowExtensionEvent, true);
  window.addEventListener('error', swallowExtensionEvent, false);
  window.addEventListener('unhandledrejection', swallowExtensionEvent, false);

  const originalConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const text = args.map(serializeError).join(' ');
    if (isExtensionNoise(text)) return;
    originalConsoleError(...args);
  };
}
