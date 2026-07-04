export const downloadFile = (file: any, fileName: string) => {
  const url = window.URL.createObjectURL(new Blob([file.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
};
